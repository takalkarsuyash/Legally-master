import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LegalMettaService {
    private pythonPath: string;

    constructor() {
        this.pythonPath = path.join(__dirname, '..', 'metta', 'metta_query_interface.py');
    }

    async query(query: string): Promise<any> {
        return new Promise((resolve, reject) => {
            // Use the virtual environment Python interpreter if it exists, otherwise fall back to system python
            let pythonExecutable = 'python3';
            if (process.platform === 'win32') {
                const venvWinPath = path.join(__dirname, '..', 'metta', 'venv', 'Scripts', 'python.exe');
                pythonExecutable = fs.existsSync(venvWinPath) ? venvWinPath : 'python';
            } else {
                const venvUnixPath = path.join(__dirname, '..', 'metta', 'venv', 'bin', 'python3');
                pythonExecutable = fs.existsSync(venvUnixPath) ? venvUnixPath : 'python3';
            }
            
            const python = spawn(pythonExecutable, [this.pythonPath, query], {
                cwd: path.join(__dirname, '..'),
                env: {
                    ...process.env,
                    ASI_ONE_API_KEY: process.env.ASI_ONE_API_KEY || process.env.VITE_ASI_KEY
                }
            });

            let output = '';
            let errorOutput = '';

            python.stdout.on('data', (data) => {
                output += data.toString();
            });

            python.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            python.on('close', (code) => {
                if (code === 0) {
                    try {
                        const result = JSON.parse(output);
                        resolve(result);
                    } catch (error) {
                        reject(new Error(`Failed to parse Python output: ${output}`));
                    }
                } else {
                    reject(new Error(`Python process exited with code ${code}: ${errorOutput}`));
                }
            });

            python.on('error', (error) => {
                reject(new Error(`Failed to start Python process: ${error.message}`));
            });
        });
    }
}

export default LegalMettaService;

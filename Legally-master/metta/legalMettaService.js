// Legal MeTTa Service API endpoint
// This service will act as an intermediary between the React frontend and the Python MeTTa agent
import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Endpoint to query the MeTTa legal agent
router.post('/metta-query', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Spawn the Python process to query the MeTTa agent
    const pythonProcess = spawn('python3', [
      path.join(__dirname, '../metta_query_interface.py'),
      query
    ]);

    let response = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      response += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python process exited with code ${code}`);
        console.error(`Error output: ${errorOutput}`);
        return res.status(500).json({ 
          error: 'Error processing query with MeTTa agent', 
          details: errorOutput 
        });
      }

      try {
        const result = JSON.parse(response.trim());
        res.json(result);
      } catch (parseError) {
        console.error('Error parsing Python response:', parseError);
        res.status(500).json({ 
          error: 'Error parsing response from MeTTa agent',
          response: response 
        });
      }
    });

  } catch (error) {
    console.error('Error in metta-query endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Legal MeTTa Service' });
});

export default router;
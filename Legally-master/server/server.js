"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cors_1 = require("cors");
var fs_1 = require("fs");
var path_1 = require("path");
var multer_1 = require("multer");
var sdk_1 = require("@lighthouse-web3/sdk");
var dotenv_1 = require("dotenv");
var path_2 = require("path");
var url_1 = require("url");
dotenv_1.default.config();
var app = (0, express_1.default)();
var port = 3000;
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = (0, path_2.dirname)(__filename);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
var storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
var upload = (0, multer_1.default)({ storage: storage });
console.log("API Key loaded? ", ((_a = process.env.LIGHTHOUSE_API) === null || _a === void 0 ? void 0 : _a.slice(0, 6)) + "...");
app.post("/upload", upload.single("file"), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var filePath, apiKey, uploadResponse, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                if (!req.file) {
                    res.status(400).json({ error: "No file uploaded" });
                    return [2 /*return*/];
                }
                console.log("Received file:", req.file);
                filePath = path_1.default.join(__dirname, "uploads", req.file.filename);
                console.log("File exists? ", fs_1.default.existsSync(filePath));
                console.log("File path: ", filePath);
                apiKey = process.env.LIGHTHOUSE_API || "";
                return [4 /*yield*/, sdk_1.default.upload(filePath, apiKey)];
            case 1:
                uploadResponse = _a.sent();
                console.log("Lighthouse upload response:", uploadResponse);
                // Clean up the temporary file
                fs_1.default.unlinkSync(filePath);
                res.json({
                    message: "File uploaded successfully",
                    cid: uploadResponse.data.Hash,
                    lighthouseResponse: uploadResponse,
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error("Upload error:", error_1);
                res.status(500).json({ error: "Upload failed" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.use("/retrieve", function (req, res) {
});
app.listen(port, function () {
    return console.log("Express is listening at http://localhost:".concat(port));
});

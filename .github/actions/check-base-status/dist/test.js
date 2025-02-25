"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const github = __importStar(require("@actions/github"));
function testRun() {
    return __awaiter(this, void 0, void 0, function* () {
        // You'll need to provide your GitHub token here
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            console.error('Please set GITHUB_TOKEN environment variable');
            process.exit(1);
        }
        const octokit = github.getOctokit(token);
        // Replace these with your repository details
        const owner = 'your-username';
        const repo = 'your-repo-name';
        const branch = 'main';
        try {
            // Test the branch status check
            const { data: baseRef } = yield octokit.rest.repos.getBranch({
                owner,
                repo,
                branch,
            });
            const latestCommitSha = baseRef.commit.sha;
            console.log(`Latest commit SHA: ${latestCommitSha}`);
            const { data: status } = yield octokit.rest.repos.getCombinedStatusForRef({
                owner,
                repo,
                ref: latestCommitSha,
            });
            const { data: checkRuns } = yield octokit.rest.checks.listForRef({
                owner,
                repo,
                ref: latestCommitSha,
            });
            console.log('\nStatus Check Results:');
            console.log('--------------------');
            console.log(`Overall Status: ${status.state}`);
            console.log('\nCheck Runs:');
            checkRuns.check_runs.forEach(check => {
                console.log(`- ${check.name}: ${check.conclusion}`);
            });
        }
        catch (error) {
            if (error instanceof Error) {
                console.error('Error:', error.message);
            }
        }
    });
}
testRun();

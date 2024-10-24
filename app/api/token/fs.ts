'use server';

import path from "path";
import { promises as fs } from "fs";
import { SplToken } from "@/app/types/SplToken";

const TOKEN_FILE_PATH = path.join(process.cwd(), './server-files/token/token.json');

/**
 * Retrieves the SPL token information from the file system.
 * @returns {Promise<SplToken>} A promise that resolves to the SPL token object.
 * @throws {Error} If there's an error reading the token file.
 */
export async function getSplToken(): Promise<SplToken> {
  try {
    const tokenFile = await fs.readFile(TOKEN_FILE_PATH, 'utf8');
    return JSON.parse(tokenFile);
  } catch (error) {
    console.error('Error reading token file:', error);
    throw error;
  }
}

/**
 * Saves the SPL token information to the file system.
 * @param {SplToken} token - The SPL token object to be saved.
 * @returns {Promise<void>} A promise that resolves when the token is saved.
 */
export async function saveSplToken(token: SplToken): Promise<void> {
  await fs.writeFile(TOKEN_FILE_PATH, JSON.stringify(token, null, 2), 'utf8');
}
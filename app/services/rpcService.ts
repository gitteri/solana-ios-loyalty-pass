import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction
} from '@solana/web3.js';
import {
  createInitializeMintInstruction,
  createInitializePermanentDelegateInstruction,
  ExtensionType,
  getAssociatedTokenAddressSync,
  getMintLen,
  getOrCreateAssociatedTokenAccount,
  mintToChecked,
  TOKEN_2022_PROGRAM_ID,
  transferChecked
} from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { validatePublicKey } from '../utils/publicKey';
import { splToBN } from '../utils/balance';
import { Wallet, SimpleTransaction } from '../types/Wallet';
import { SplToken } from '../types/SplToken';

// Define constants for network types
export const DEVNET = 'devnet' as const;
export const MAINNET = 'mainnet' as const;
export type Network = typeof DEVNET | typeof MAINNET;

/**
 * Get the network from environment variables
 * @returns {Network} The network type (DEVNET or MAINNET)
 */
export const getNetworkFromEnv = (): Network => {
  const network = process.env.NEXT_PUBLIC_NETWORK as Network;
  if (![DEVNET, MAINNET].includes(network)) {
    console.warn(`Invalid network value provided: ${network}. Defaulting to ${DEVNET}.`);
    return DEVNET;
  }
  return network;
}

/**
 * RpcService: A class for interacting with the Helius API for Solana blockchain operations
 * It provides methods to get the connection to the Helius RPC, airdrop SOL, get SOL and SPL balances,
 * get transaction history, and perform various token operations like transfer, compress, and decompress.
 */
export class RpcService {
  public connection: Connection;
  public network: string;

  constructor(api_key: string, network: string = DEVNET) {
    this.connection = this.getConnection(api_key, network);
    this.network = network;
  }

  /**
   * Get a connection to the Helius API
   * @param {string} api_key - The Helius API key
   * @param {string} network - The network to connect to (default: DEVNET)
   * @returns {Connection} A connection to the Helius API
   */
  getConnection(api_key: string, network: string = DEVNET): Connection {
    if (!api_key) {
      api_key = process.env.NEXT_PUBLIC_HELIUS_API_KEY || '';
    }
    // Note: you can replace helius with any other RPC provider as desired
    const RPC_ENDPOINT = `https://${network}.helius-rpc.com?api-key=${api_key}`;
    const connection = new Connection(RPC_ENDPOINT);
    console.log("Debug: connection to", RPC_ENDPOINT, "created");
    return connection;
  }

  /**
   * Airdrop SOL to a given public key
   * @param {PublicKey} publicKey - The public key to receive the airdrop
   * @param {number} amount - The amount of SOL to airdrop (default: 1)
   * @returns {Promise<string>} The transaction signature
   */
  async airdropSolana(publicKey: PublicKey, amount: number = 1): Promise<string> {
    try {
      if (!validatePublicKey(publicKey)) {
        return '';
      }

      const lamports = amount * 1e9;
      const signature = await this.connection.requestAirdrop(publicKey, lamports);
      const latestBlockhash = await this.connection.getLatestBlockhash();
      await this.connection.confirmTransaction({
        signature,
        ...latestBlockhash
      });
      console.log(`Debug: Successfully airdropped ${amount} SOL to ${publicKey.toBase58()}`);
      return signature;
    } catch (error) {
      console.error("Error airdropping SOL:", error);
      throw error;
    }
  }

  /**
   * Get the SOL balance for a given public key
   * @param {PublicKey} publicKey - The public key to check the balance for
   * @returns {Promise<BN>} The SOL balance as a BN
   */
  async getSolBalance(publicKey: PublicKey): Promise<BN> {
    try {
      if (!validatePublicKey(publicKey)) {
        return new BN(0);
      }

      console.log("Debug: getting SOL balance for", publicKey.toBase58());
      const balance = await this.connection.getBalance(publicKey);
      if (balance === 0) {
        console.warn(`Debug: SOL balance for ${publicKey.toBase58()} is 0`);
        return new BN(0);
      }
      console.log(`Debug: SOL balance for ${publicKey.toBase58()} is ${balance / 1e9} SOL`);
      return new BN(balance);
    } catch (error) {
      console.error("Error fetching SOL balance:", error);
      throw error;
    }
  }

  /**
   * Get the SPL token balance for a given public key and mint
   * @param {PublicKey} publicKey - The public key to check the balance for
   * @param {SplToken} mint - The SPL token mint
   * @returns {Promise<BN>} The SPL token balance as a BN
   */
  async getSplBalance(publicKey: PublicKey, mint: SplToken): Promise<BN> {
    try {
      const pk = new PublicKey(publicKey);
      if (!validatePublicKey(pk)) {
        return new BN(0);
      }

      console.log("getting spl balance", mint);
      const response = await this.connection.getTokenAccountsByOwner(
        pk,
        {
          mint: new PublicKey(mint.mint),
          programId: new PublicKey(mint.programId)
        }
      );

      if (response.value.length === 0) {
        console.log("No token account found for this wallet");
        return new BN(0);
      }

      const tokenAccountInfo = response.value[0].account.data;
      const balance = new BN(tokenAccountInfo.subarray(64, 72), 'le');

      console.log("Debug: SPL balance for", pk.toBase58(), "is", balance.toString());

      return balance;
    } catch (error) {
      console.error("Error fetching SPL balance:", error);
      throw error;
    }
  }

  /**
   * Get both SOL and SPL token balances for a given public key
   * @param {PublicKey} publicKey - The public key to check the balances for
   * @param {SplToken} mint - The SPL token mint
   * @returns {Promise<{ solBalance: BN; splBalance: BN }>} The SOL and SPL token balances
   */
  async getAllBalances(publicKey: PublicKey, mint: SplToken): Promise<{ solBalance: BN; splBalance: BN }> {
    const solBalance = await this.getSolBalance(publicKey);
    const splBalance = await this.getSplBalance(publicKey, mint);
    return { solBalance: new BN(solBalance), splBalance: splBalance };
  }

  /**
   * Get transaction history for a given public key
   * @param {PublicKey} publicKey - The public key to get the transaction history for
   * @returns {Promise<SimpleTransaction[]>} An array of SimpleTransaction objects
   */
  async getTxnHistory(publicKey: PublicKey): Promise<SimpleTransaction[]> {
    const sigHistory = await this.connection.getSignaturesForAddress(publicKey);

    return sigHistory
      .sort((a, b) => b.slot - a.slot)
      .map(sig => ({
        signature: sig.signature,
        slot: sig.slot,
      }))
      .slice(0, 50);
  }

  /**
   * Transfer SOL from one wallet to another
   * @param {Wallet} feePayerWallet - The wallet to pay the transaction fee
   * @param {Wallet} fromWallet - The wallet to transfer SOL from
   * @param {PublicKey} recipientPublicKey - The public key of the recipient
   * @param {BN} amount - The amount of SOL to transfer
   * @returns {Promise<string>} The transaction signature
   */
  async transferSol(feePayerWallet: Wallet, fromWallet: Wallet, recipientPublicKey: PublicKey, amount: BN): Promise<string> {
    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromWallet.publicKey,
          toPubkey: recipientPublicKey,
          lamports: amount.toNumber()
        })
      );

      const feePayer = Keypair.fromSecretKey(feePayerWallet.secretKey);
      const from = Keypair.fromSecretKey(fromWallet.secretKey);

      transaction.feePayer = feePayer.publicKey;
      const latestBlockhash = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;

      transaction.sign(feePayer, from);

      const signature = await this.connection.sendRawTransaction(transaction.serialize());

      await this.connection.confirmTransaction({
        signature,
        ...latestBlockhash
      });

      console.log("Debug: SOL transfer transaction submitted onchain with signature", signature);
      return signature;
    } catch (error) {
      console.error("Error in transferSol:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to transfer SOL: ${error.message}`);
      } else {
        throw new Error("Failed to transfer SOL: Unknown error");
      }
    }
  }

  /**
   * Transfer SPL tokens using a permanent delegate
   * @param {Wallet} wallet - The wallet to use as the permanent delegate
   * @param {PublicKey} fromPublicKey - The public key to transfer from
   * @param {PublicKey} toPublicKey - The public key to transfer to
   * @param {BN} amount - The amount of tokens to transfer
   * @param {SplToken} splToken - The SPL token to transfer
   * @returns {Promise<string>} The transaction signature
   */
  async transferSplPermaDelegate(
    wallet: Wallet,
    fromPublicKey: PublicKey,
    toPublicKey: PublicKey,
    amount: BN,
    splToken: SplToken
  ): Promise<string> {
    try {
      const tokenMint = new PublicKey(splToken.mint);

      const fromATA = getAssociatedTokenAddressSync(tokenMint, fromPublicKey, undefined, TOKEN_2022_PROGRAM_ID);
      const toATA = await getOrCreateAssociatedTokenAccount(
        this.connection,
        wallet,
        tokenMint,
        new PublicKey(toPublicKey),
        undefined,
        undefined,
        undefined,
        TOKEN_2022_PROGRAM_ID
      );

      const transactionSignature = await transferChecked(
        this.connection,
        wallet, // Transaction fee payer
        fromATA, // Transfer from
        tokenMint, // Mint Account address
        toATA.address, // Transfer to
        wallet, // Use Permanent Delegate as owner
        amount, // Amount
        splToken.decimals, // Mint Account decimals
        undefined, // Additional signers
        undefined, // Confirmation options
        TOKEN_2022_PROGRAM_ID, // Token Extension Program ID
      );

      console.log("Debug: SPL transfer (permanent delegate) transaction submitted onchain with signature", transactionSignature);
      return transactionSignature;
    } catch (error) {
      console.error("Error in transferSplPermaDelegate:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to transfer SPL token using permanent delegate: ${error.message}`);
      } else {
        throw new Error("Failed to transfer SPL token using permanent delegate: Unknown error");
      }
    }
  }

  /**
   * Transfer SPL tokens from one wallet to another
   * @param {Wallet} feePayerWallet - The wallet to pay the transaction fee
   * @param {Wallet} fromWallet - The wallet to transfer tokens from
   * @param {PublicKey} recipientPublicKey - The public key of the recipient
   * @param {string} amount - The amount of tokens to transfer
   * @param {SplToken} splToken - The SPL token to transfer
   * @returns {Promise<string>} The transaction signature
   */
  async transferSpl(feePayerWallet: Wallet, fromWallet: Wallet, recipientPublicKey: PublicKey, amount: string, splToken: SplToken): Promise<string> {
    const amountBN = splToBN(amount, splToken.decimals);
    const from = Keypair.fromSecretKey(fromWallet.secretKey);
    const feePayer = Keypair.fromSecretKey(feePayerWallet.secretKey);
    const tokenMint = new PublicKey(splToken.mint);
    const fromATA = getAssociatedTokenAddressSync(tokenMint, from.publicKey, undefined, TOKEN_2022_PROGRAM_ID);
    const recipientATA = await getOrCreateAssociatedTokenAccount(this.connection, from, tokenMint, recipientPublicKey, undefined, undefined, undefined, TOKEN_2022_PROGRAM_ID);
    const signature = await transferChecked(this.connection, feePayer, fromATA, tokenMint, recipientATA.address, from, amountBN, splToken.decimals, undefined, undefined, TOKEN_2022_PROGRAM_ID);
    console.log("Debug: transaction submitted onchain with signature", signature);
    return signature;
  }

  /**
   * Create a new SPL token
   * @param {Wallet} wallet - The wallet to use for creating the token
   * @returns {Promise<SplToken>} The created SPL token
   */
  async createSplToken(wallet: Wallet): Promise<SplToken> {
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;
    const decimals = 0;
    const mintAuthority = wallet.publicKey;
    const permanentDelegate = wallet.publicKey;
    const mintLen = getMintLen([ExtensionType.PermanentDelegate]);
    const lamports = await this.connection.getMinimumBalanceForRentExemption(mintLen);

    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: wallet.publicKey, // Account that will transfer lamports to created account
      newAccountPubkey: mint, // Address of the account to create
      space: mintLen, // Amount of bytes to allocate to the created account
      lamports, // Amount of lamports transferred to created account
      programId: TOKEN_2022_PROGRAM_ID, // Program assigned as owner of created account
    });

    const initializePermanentDelegateInstruction =
      createInitializePermanentDelegateInstruction(
        mint, // Mint Account address
        permanentDelegate, // Designated Permanent Delegate
        TOKEN_2022_PROGRAM_ID, // Token Extension Program ID
      );

    const initializeMintInstruction = createInitializeMintInstruction(
      mint, // Mint Account Address
      decimals, // Decimals of Mint
      mintAuthority, // Designated Mint Authority
      null, // Optional Freeze Authority
      TOKEN_2022_PROGRAM_ID, // Token Extension Program ID
    );

    const transaction = new Transaction().add(
      createAccountInstruction,
      initializePermanentDelegateInstruction,
      initializeMintInstruction,
    );

    const transactionSignature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [wallet, mintKeypair],
    );

    console.log(
      "\nCreate Mint Account:",
      `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`,
    );

    return {
      mint: mint,
      programId: TOKEN_2022_PROGRAM_ID,
      name: "Loyalty Points",
      symbol: "LOYAL",
      decimals: decimals,
      issuer: wallet.publicKey,
      issuerBalance: new BN(0),
      issuerBalanceSol: new BN(0),
    }
  }

  /**
   * Mint new SPL tokens
   * @param {Wallet} wallet - The wallet to use for minting
   * @param {PublicKey} destination - The destination public key
   * @param {BN} amount - The amount of tokens to mint
   * @param {SplToken} splToken - The SPL token to mint
   * @returns {Promise<string>} The transaction signature
   */
  async mintSplToken(wallet: Wallet, destination: PublicKey, amount: BN, splToken: SplToken): Promise<string> {
    const recipientATA = await getOrCreateAssociatedTokenAccount(this.connection, wallet, new PublicKey(splToken.mint), destination, undefined, undefined, undefined, TOKEN_2022_PROGRAM_ID);
    console.log("Debug: recipientATA", recipientATA);
    const signature = await mintToChecked(this.connection, wallet, new PublicKey(splToken.mint), recipientATA.address, wallet, amount, splToken.decimals, undefined, undefined, TOKEN_2022_PROGRAM_ID);
    console.log("Debug: mint transaction submitted onchain with signature", signature);
    return signature;
  }
}

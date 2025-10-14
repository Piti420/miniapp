"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Wallet } from "@coinbase/onchainkit/wallet";
import { ethers } from "ethers";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Particles from './components/Particles';

// Konfiguracja adresów kontraktów
const GM_CONTRACT = "0x06B17752e177681e5Df80e0996228D7d1dB2F61b";
const WEBSITE_URL = "https://piti420.github.io/Base-Hello";

// Error interface for better type safety
interface EthereumError {
  code: number;
  message: string;
}

// ABI kontraktu GM
const gmABI = [
  "function sayGM(string memory _message) public",
  "function getGreeting() public view returns (string memory)",
  "function getLastGreeter() public view returns (address)",
  "function getGreetingCount() public view returns (uint256)",
  "event NewGM(address indexed greeter, string message)"
];

export default function Home() {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [userAddress, setUserAddress] = useState<string>("");
  const [greetingMessage, setGreetingMessage] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [showShareButtons, setShowShareButtons] = useState<boolean>(false);
  const logoRef = useRef<HTMLImageElement>(null);

  // Sprawdzenie sieci Base
  const checkNetwork = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not detected");
      }
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const baseMainnetChainId = '0x2105'; // 8453 w hex
      console.log("Current chainId:", chainId);
      if (chainId !== baseMainnetChainId) {
        console.log("Switching to Base Mainnet...");
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: baseMainnetChainId }],
        });
        toast.info("Switched to Base Mainnet");
      }
    } catch (switchError: unknown) {
      if ((switchError as EthereumError).code === 4902) {
        console.log("Adding Base Mainnet to MetaMask...");
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x2105',
            chainName: 'Base Mainnet',
            rpcUrls: ['https://mainnet.base.org'],
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            blockExplorerUrls: ['https://basescan.org']
          }],
        });
        toast.info("Added Base Mainnet to MetaMask");
      } else {
        console.error("Network switch error:", switchError);
        toast.error(`Failed to switch network: ${(switchError as EthereumError).message}`);
        throw switchError;
      }
    }
  };

  // Połączenie z portfelem
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not detected! Please install it.");
      return;
    }
    try {
      console.log("Connecting wallet...");
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      await web3Provider.send("eth_requestAccounts", []);
      const web3Signer = web3Provider.getSigner();
      const address = await web3Signer.getAddress();
      
      setProvider(web3Provider);
      setSigner(web3Signer);
      setUserAddress(address);
      setIsConnected(true);
      
      toast.success(`Connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
      await checkNetwork();
      await updateGreetingInfo();
    } catch (err: unknown) {
      console.error("Connect error:", err);
      toast.error(`Failed to connect wallet: ${(err as EthereumError).message}`);
    }
  };

  // Aktualizacja informacji o powitaniach
  const updateGreetingInfo = async () => {
    if (!provider) {
      console.warn("Provider not initialized, skipping updateGreetingInfo");
      return;
    }
    try {
      await checkNetwork();
      const contract = new ethers.Contract(GM_CONTRACT, gmABI, provider);
      const greeting = await contract.getGreeting();
      const count = await contract.getGreetingCount();
      const lastGreeter = await contract.getLastGreeter();
      toast.info(`Latest Greeting: "${greeting}" | Total Greetings: ${count} | Last Greeter: ${lastGreeter.slice(0, 6)}...${lastGreeter.slice(-4)}`);
    } catch (err) {
      console.error("Error fetching greeting info:", err);
    }
  };

  // Greet Onchain (z inputu)
  const greetOnchain = async () => {
    try {
      if (!signer) return toast.error("Connect your wallet first");

      await checkNetwork();
      const contract = new ethers.Contract(GM_CONTRACT, gmABI, signer);
      if (!greetingMessage) return toast.error("Please enter a greeting message");
      
      console.log("Sending greet transaction:", greetingMessage);
      const tx = await contract.sayGM(greetingMessage, { gasLimit: 150000 });
      toast.info("Awaiting transaction confirmation...");
      await tx.wait();

      toast.success("Greeted onchain! Your message is live!");
      setShowShareButtons(true);
      animateLogo();
      await updateGreetingInfo();

      const _shareText = encodeURIComponent(`I just said "${greetingMessage}" on Base! 🚀 Join the community at ${WEBSITE_URL} #Base #Web3 #GM`);
      // Update share links would be handled by state
    } catch (err: unknown) {
      console.error("Greet error:", err);
      toast.error(`Failed to send GM: ${(err as EthereumError).message}`);
    }
  };

  // GM (domyślne powitanie)
  const sendGM = async () => {
    try {
      if (!signer) return toast.error("Connect your wallet first");

      await checkNetwork();
      const contract = new ethers.Contract(GM_CONTRACT, gmABI, signer);
      const message = "GM, Base!";
      console.log("Sending GM transaction...");
      const tx = await contract.sayGM(message, { gasLimit: 150000 });
      toast.info("Awaiting transaction confirmation...");
      await tx.wait();

      toast.success("GM sent onchain! Your message is live!");
      setShowShareButtons(true);
      animateLogo();
      await updateGreetingInfo();

      const _shareText = encodeURIComponent(`I just said "${message}" on Base! 🚀 Join the community at ${WEBSITE_URL} #Base #Web3 #GM`);
    } catch (err: unknown) {
      console.error("GM error:", err);
      toast.error(`Failed to send GM: ${(err as EthereumError).message}`);
    }
  };

  // Animacja logo
  const animateLogo = () => {
    if (logoRef.current) {
      logoRef.current.classList.add("pulse");
      setTimeout(() => logoRef.current?.classList.remove("pulse"), 1000);
    }
  };

  return (
    <>
      <Particles />
      <div className="hello-container">
        <header style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem' }}>
          <Wallet />
        </header>

        <Image
          ref={logoRef}
          src="/hello.png"
          alt="Base Logo"
          width={180}
          height={180}
          className="hello-logo"
        />
        <h1 className="hello-title">Hello Base World</h1>
        <p className="hello-subtitle">Say GM onchain and join the Base community! 🚀</p>

        <div className="input-section">
          <input
            type="text"
            className="greeting-input"
            placeholder="Enter your GM message (e.g., Hello Base!)"
            value={greetingMessage}
            onChange={(e) => setGreetingMessage(e.target.value)}
          />
        </div>

        <div className="buttons">
          <button onClick={connectWallet}>
            {isConnected ? `Connected: ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : "Connect Wallet"}
          </button>
          <button onClick={greetOnchain} disabled={!isConnected}>
            Greet Onchain
          </button>
        </div>
        
        <div className="gm-button">
          <button onClick={sendGM} disabled={!isConnected}>
            GM
          </button>
        </div>

        {showShareButtons && (
          <div className="share-buttons">
            <p>✅ Greeted successfully! Share it with the Base community:</p>
            <a 
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just said "${greetingMessage || 'GM, Base!'}" on Base! 🚀 Join the community at ${WEBSITE_URL} #Base #Web3 #GM`)}`}
              target="_blank"
              rel="noreferrer"
            >
              Share on X
            </a> 
            | 
            <a 
              href={`https://warpcast.com/~/compose?text=${encodeURIComponent(`I just said "${greetingMessage || 'GM, Base!'}" on Base! 🚀 Join the community at ${WEBSITE_URL} #Base #Web3 #GM`)}`}
              target="_blank"
              rel="noreferrer"
            >
              Share on Farcaster
            </a>
          </div>
        )}

        <footer className="hello-footer">
          <p className="built">
            🚀 Built on Base | <a href="https://base.org" target="_blank" rel="noreferrer">Explore Base</a> | <a href="https://basescan.org/address/0x06B17752e177681e5Df80e0996228D7d1dB2F61b" target="_blank" rel="noreferrer">View GM Contract</a>
          </p>
        </footer>
      </div>
      
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </>
  );
}

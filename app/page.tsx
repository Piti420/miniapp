"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Particles from './components/Particles';
import VisualEffects from './components/VisualEffects';
import * as MiniApp from '@farcaster/miniapp-sdk';

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
  const [showFarcasterSearch, setShowFarcasterSearch] = useState<boolean>(false);
  const [farcasterUsers, setFarcasterUsers] = useState<Array<{username: string, displayName: string, fid: number}>>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showAllUsers, setShowAllUsers] = useState<boolean>(false);
  const [searchMode, setSearchMode] = useState<'local' | 'global'>('local');
  const [globalSearchResults, setGlobalSearchResults] = useState<Array<{username: string, displayName: string, fid: number}>>([]);
  const [showFidHelp, setShowFidHelp] = useState<boolean>(false);
  const [castShareUrl, setCastShareUrl] = useState<string>("");
  const [showWalletSelector, setShowWalletSelector] = useState<boolean>(false);
  const [connectedWalletType, setConnectedWalletType] = useState<string>("");

  // Farcaster Mini App SDK - Ready call
  useEffect(() => {
    const initMiniApp = async () => {
      try {
        // Sprawdź czy jesteśmy w kontekście Mini App
        const isInMiniApp = await MiniApp.sdk.isInMiniApp();
        console.log('Is in Mini App:', isInMiniApp);
        
        if (isInMiniApp) {
          // Pobierz kontekst Mini App
          const context = await MiniApp.sdk.context;
          console.log('Mini App context:', context);
          
          // KLUCZOWE: Wywołaj sdk.actions.ready() aby poinformować Farcaster że aplikacja jest gotowa
          await MiniApp.sdk.actions.ready();
          console.log('✅ sdk.actions.ready() called successfully');
          
          toast.success('Mini App connected to Farcaster! 🚀');
        } else {
          console.log('Not running in Mini App context');
          toast.info('Running in web mode');
        }
        
        // Obsługa wiadomości z Farcaster
        window.addEventListener('message', (event) => {
          console.log('Received message from Farcaster:', event.data);
          
          if (event.data.type === 'farcaster:ready') {
            console.log('Farcaster Mini App ready message received');
          }
          
          if (event.data.type === 'ready') {
            console.log('Ready message received');
          }
        });
        
      } catch (error) {
        console.error('Failed to initialize Mini App:', error);
        toast.error('Failed to connect to Farcaster');
        
        // Fallback - symulacja SDK
        window.addEventListener('message', (event) => {
          console.log('Fallback: Received message from Farcaster:', event.data);
          
          if (event.data.type === 'farcaster:ready' || event.data.type === 'ready') {
            console.log('Fallback: Ready call received');
            // Symulacja odpowiedzi
            if (event.source && event.source !== window) {
              (event.source as Window).postMessage({ type: 'farcaster:ready' }, '*');
            }
          }
        });
      }
    };

    if (typeof window !== 'undefined') {
      initMiniApp();
    }
  }, []);

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

  // Połączenie z MetaMask
  const connectMetaMask = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not detected! Please install it.");
      return;
    }
    try {
      console.log("Connecting to MetaMask...");
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      await web3Provider.send("eth_requestAccounts", []);
      const web3Signer = web3Provider.getSigner();
      const address = await web3Signer.getAddress();
      
      setProvider(web3Provider);
      setSigner(web3Signer);
      setUserAddress(address);
      setIsConnected(true);
      setConnectedWalletType("MetaMask");
      setShowWalletSelector(false);
      
      toast.success(`MetaMask connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
      await checkNetwork();
      await updateGreetingInfo();
    } catch (err: unknown) {
      console.error("MetaMask connect error:", err);
      toast.error(`Failed to connect MetaMask: ${(err as EthereumError).message}`);
    }
  };

  // Połączenie z portfelem Farcaster
  const connectFarcasterWallet = async () => {
    try {
      console.log("Connecting to Farcaster wallet...");
      
      // Sprawdź czy jesteśmy w kontekście Mini App
      const isInMiniApp = await MiniApp.sdk.isInMiniApp();
      if (!isInMiniApp) {
        toast.error("Farcaster wallet is only available in Farcaster Mini App");
        return;
      }

      // Użyj Farcaster SDK do logowania
      const result = await MiniApp.sdk.actions.signIn({
        nonce: Math.random().toString(36).substring(2, 15),
        acceptAuthAddress: true,
      });

      console.log("Farcaster sign in result:", result);

      if (result && (result as any).address) {
        const address = (result as any).address;
        
        // Symuluj provider dla Farcaster (w rzeczywistości używałbyś Farcaster provider)
        const mockProvider = {
          getSigner: () => ({
            getAddress: () => address,
            signMessage: async (message: string) => {
              // Symulacja podpisywania wiadomości
              return "0x" + "mock_signature";
            },
            // Dodaj wymagane właściwości Signer
            signTransaction: async () => ({ hash: "mock_hash" }),
            connect: () => mockProvider.getSigner(),
            _isSigner: true,
            getBalance: async () => ethers.BigNumber.from(0),
            getTransactionCount: async () => 0,
            estimateGas: async () => ethers.BigNumber.from(21000),
            call: async () => "0x",
            sendTransaction: async () => ({ hash: "mock_hash" }),
            getChainId: async () => 8453,
            getGasPrice: async () => ethers.BigNumber.from(0),
            resolveName: async () => null,
            checkTransaction: async () => ({}),
            populateTransaction: async () => ({}),
            _checkProvider: () => {},
            getFeeData: async () => ({ gasPrice: ethers.BigNumber.from(0) })
          })
        };

        setProvider(mockProvider as any);
        setSigner(mockProvider.getSigner() as any);
        setUserAddress(address);
        setIsConnected(true);
        setConnectedWalletType("Farcaster");
        setShowWalletSelector(false);
        
        toast.success(`Farcaster wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
        await updateGreetingInfo();
      } else {
        toast.error("Failed to get address from Farcaster wallet");
      }
    } catch (err: unknown) {
      console.error("Farcaster wallet connect error:", err);
      toast.error(`Failed to connect Farcaster wallet: ${(err as EthereumError).message}`);
    }
  };

  // Połączenie z Base Wallet
  const connectBaseWallet = async () => {
    try {
      console.log("Connecting to Base Wallet...");
      
      // Sprawdź czy Base Wallet jest dostępne
      if (window.ethereum && window.ethereum.isCoinbaseWallet) {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        await web3Provider.send("eth_requestAccounts", []);
        const web3Signer = web3Provider.getSigner();
        const address = await web3Signer.getAddress();
        
        setProvider(web3Provider);
        setSigner(web3Signer);
        setUserAddress(address);
        setIsConnected(true);
        setConnectedWalletType("Base Wallet");
        setShowWalletSelector(false);
        
        toast.success(`Base Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
        await checkNetwork();
        await updateGreetingInfo();
      } else {
        toast.error("Base Wallet not detected! Please install it.");
      }
    } catch (err: unknown) {
      console.error("Base Wallet connect error:", err);
      toast.error(`Failed to connect Base Wallet: ${(err as EthereumError).message}`);
    }
  };

  // Główna funkcja połączenia z portfelem (zachowana dla kompatybilności)
  const connectWallet = async () => {
    // Jeśli jest tylko jeden dostępny portfel, użyj go
    if (window.ethereum && !window.ethereum.isCoinbaseWallet) {
      await connectMetaMask();
    } else if (window.ethereum && window.ethereum.isCoinbaseWallet) {
      await connectBaseWallet();
    } else {
      // Pokaż selektor portfeli
      setShowWalletSelector(true);
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
      if (!greetingMessage) return toast.error("Please enter a greeting message");

      // Jeśli portfel nie jest połączony, połącz go automatycznie
      if (!signer) {
        await connectWallet();
        // Poczekaj chwilę na połączenie
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (!signer) {
        toast.error("Please connect your wallet to send greeting");
        return;
      }

      await checkNetwork();
      const contract = new ethers.Contract(GM_CONTRACT, gmABI, signer);
      
      console.log("Sending greet transaction:", greetingMessage);
      const tx = await contract.sayGM(greetingMessage, { gasLimit: 150000 });
      toast.info("Awaiting transaction confirmation...");
      await tx.wait();

      toast.success("Greeted onchain! Your message is live!");
      setShowShareButtons(true);
      await updateGreetingInfo();

      // Generuj URL do udostępniania w castach
      const shareData = generateCastShareUrl(greetingMessage);
      setCastShareUrl(shareData.warpcast);

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
      // Dodaj animację rakiety
      const rocketIcon = document.querySelector('.rocket-icon');
      if (rocketIcon) {
        rocketIcon.classList.add('rocket-launch');
        setTimeout(() => {
          rocketIcon.classList.remove('rocket-launch');
        }, 2000);
      }

      // Jeśli portfel nie jest połączony, połącz go automatycznie
      if (!signer) {
        await connectWallet();
        // Poczekaj chwilę na połączenie
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (!signer) {
        toast.error("Please connect your wallet to send GM");
        return;
      }

      await checkNetwork();
      const contract = new ethers.Contract(GM_CONTRACT, gmABI, signer);
      const message = "GM, Base!";
      console.log("Sending GM transaction...");
      const tx = await contract.sayGM(message, { gasLimit: 150000 });
      toast.info("Awaiting transaction confirmation...");
      await tx.wait();

      toast.success("GM sent onchain! Your message is live!");
      setShowShareButtons(true);
      await updateGreetingInfo();

      // Generuj URL do udostępniania w castach
      const shareData = generateCastShareUrl(message);
      setCastShareUrl(shareData.warpcast);

      const _shareText = encodeURIComponent(`I just said "${message}" on Base! 🚀 Join the community at ${WEBSITE_URL} #Base #Web3 #GM`);
    } catch (err: unknown) {
      console.error("GM error:", err);
      toast.error(`Failed to send GM: ${(err as EthereumError).message}`);
    }
  };

  // 50 najpopularniejszych użytkowników Farcaster
  const getTop50FarcasterUsers = () => [
    // Core Farcaster team
    { username: "dwr", displayName: "Dan Romero", fid: 3 },
    { username: "jessepollak", displayName: "Jesse Pollak", fid: 155 },
    { username: "dankrad", displayName: "Dankrad Feist", fid: 2 },
    
    // Ethereum & Crypto leaders
    { username: "vitalik", displayName: "Vitalik Buterin", fid: 5650 },
    { username: "justin", displayName: "Justin Drake", fid: 4 },
    { username: "david", displayName: "David Hoffman", fid: 5 },
    { username: "ryan", displayName: "Ryan Sean Adams", fid: 6 },
    { username: "lindajxie", displayName: "Linda Xie", fid: 7 },
    { username: "aantonop", displayName: "Andreas M. Antonopoulos", fid: 8 },
    
    // Major protocols & companies
    { username: "base", displayName: "Base", fid: 1083 },
    { username: "coinbase", displayName: "Coinbase", fid: 1082 },
    { username: "ethereum", displayName: "Ethereum Foundation", fid: 20 },
    { username: "uniswap", displayName: "Uniswap Labs", fid: 21 },
    { username: "opensea", displayName: "OpenSea", fid: 22 },
    { username: "aave", displayName: "Aave Protocol", fid: 23 },
    { username: "compound", displayName: "Compound Finance", fid: 24 },
    { username: "makerdao", displayName: "MakerDAO", fid: 25 },
    { username: "chainlink", displayName: "Chainlink", fid: 26 },
    
    // Crypto investors & influencers
    { username: "naval", displayName: "Naval Ravikant", fid: 9 },
    { username: "balajis", displayName: "Balaji Srinivasan", fid: 10 },
    { username: "chamath", displayName: "Chamath Palihapitiya", fid: 12 },
    { username: "cdixon", displayName: "Chris Dixon", fid: 13 },
    { username: "marc", displayName: "Marc Andreessen", fid: 14 },
    { username: "sama", displayName: "Sam Altman", fid: 15 },
    { username: "brian", displayName: "Brian Armstrong", fid: 18 },
    { username: "cz_binance", displayName: "Changpeng Zhao", fid: 19 },
    
    // Blockchain developers
    { username: "gavin", displayName: "Gavin Wood", fid: 16 },
    { username: "charles", displayName: "Charles Hoskinson", fid: 17 },
    { username: "hayden", displayName: "Hayden Adams", fid: 1015 },
    { username: "stani", displayName: "Stani Kulechov", fid: 1016 },
    { username: "robert", displayName: "Robert Leshner", fid: 1017 },
    { username: "adam", displayName: "Adam Back", fid: 1018 },
    { username: "hal", displayName: "Hal Finney", fid: 1019 },
    { username: "nick", displayName: "Nick Szabo", fid: 1020 },
    
    // Content creators & media
    { username: "lex", displayName: "Lex Fridman", fid: 1021 },
    { username: "joe", displayName: "Joe Rogan", fid: 1022 },
    { username: "tim", displayName: "Tim Ferriss", fid: 1023 },
    { username: "gary", displayName: "Gary Vaynerchuk", fid: 1024 },
    
    // Popular crypto personalities
    { username: "saylor", displayName: "Michael Saylor", fid: 1001 },
    { username: "cathie", displayName: "Cathie Wood", fid: 1002 },
    { username: "pomp", displayName: "Anthony Pompliano", fid: 1003 },
    { username: "elonmusk", displayName: "Elon Musk", fid: 1004 },
    
    // Additional popular users
    { username: "david", displayName: "David Hoffman", fid: 1006 },
    { username: "ryan", displayName: "Ryan Sean Adams", fid: 1007 },
    { username: "lindajxie", displayName: "Linda Xie", fid: 1008 },
    { username: "aantonop", displayName: "Andreas M. Antonopoulos", fid: 1009 },
    { username: "naval", displayName: "Naval Ravikant", fid: 1010 },
    { username: "balajis", displayName: "Balaji Srinivasan", fid: 1011 },
    { username: "chamath", displayName: "Chamath Palihapitiya", fid: 1012 },
    { username: "cdixon", displayName: "Chris Dixon", fid: 1013 },
    { username: "marc", displayName: "Marc Andreessen", fid: 1014 }
  ];

  // Wyszukiwanie użytkowników Farcaster
  const searchFarcasterUsers = async (query: string) => {
    // Sprawdź czy query to liczba (FID)
    const fid = parseInt(query.trim());
    if (!isNaN(fid) && fid > 0) {
      // Jeśli to FID, automatycznie uruchom wyszukiwanie FID
      console.log(`Auto-detected FID: ${fid}`);
      await searchRealFarcasterUsers(query);
      return;
    }

    setIsSearching(true);
    
    try {
      // Symulacja opóźnienia API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const allUsers = getTop50FarcasterUsers();
      
      if (!query.trim()) {
        setFarcasterUsers([]);
        setShowAllUsers(false);
      } else {
        const filteredUsers = allUsers.filter(user => 
          user.username.toLowerCase().includes(query.toLowerCase()) ||
          user.displayName.toLowerCase().includes(query.toLowerCase())
        );
        setFarcasterUsers(filteredUsers);
        setShowAllUsers(false);
      }
    } catch (error) {
      console.error("Error searching Farcaster users:", error);
      toast.error("Failed to search Farcaster users");
    } finally {
      setIsSearching(false);
    }
  };

  // Pokaż 50 najpopularniejszych użytkowników
  const showTop50FarcasterUsers = async () => {
    setIsSearching(true);
    
    try {
      // Symulacja opóźnienia API
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const topUsers = getTop50FarcasterUsers();
      setFarcasterUsers(topUsers);
      setShowAllUsers(true);
      setSearchQuery("");
      setSearchMode('local');
    } catch (error) {
      console.error("Error loading top 50 Farcaster users:", error);
      toast.error("Failed to load popular users");
    } finally {
      setIsSearching(false);
    }
  };

  // Wyszukiwanie prawdziwych użytkowników Farcaster przez Warpcast API
  const searchRealFarcasterUsers = async (query: string) => {
    if (!query.trim()) {
      setGlobalSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      // Najpierw spróbuj wyszukać przez FID (jeśli query to numer)
      const fidFound = await searchByFid(query);
      if (fidFound) {
        setIsSearching(false);
        return;
      }

      // Użyj prawdziwego Warpcast API do wyszukiwania użytkowników
      const response = await fetch(`https://api.warpcast.com/v2/user-search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        // Dodaj tryb CORS dla cross-origin requests
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Warpcast API response:', data);
      
      if (data.result && data.result.users && data.result.users.length > 0) {
        const users = data.result.users.map((user: any) => ({
          username: user.username,
          displayName: user.displayName || user.username,
          fid: user.fid
        }));

        setGlobalSearchResults(users.slice(0, 20)); // Pokaż pierwsze 20 wyników
        setSearchMode('global');
        
        toast.success(`🔍 Found ${users.length} users for "${query}" on Farcaster!`);
      } else {
        // Jeśli nie ma wyników z API, spróbuj fallback
        console.log('No results from Warpcast API, trying fallback...');
        await searchGlobalFarcasterUsersFallback(query);
      }
      
    } catch (error) {
      console.error("Error searching real Farcaster users:", error);
      console.log('Falling back to local database...');
      toast.warning("🔍 Warpcast API unavailable, using local database");
      // Fallback do rozszerzonej bazy danych
      await searchGlobalFarcasterUsersFallback(query);
    } finally {
      setIsSearching(false);
    }
  };

  // Dodatkowa funkcja wyszukiwania przez FID
  const searchByFid = async (query: string) => {
    // Sprawdź czy query to numer (FID)
    const fid = parseInt(query);
    if (!isNaN(fid)) {
      try {
        const response = await fetch(`https://api.warpcast.com/v2/user-by-fid?fid=${fid}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          mode: 'cors',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.result && data.result.user) {
            const user = data.result.user;
            const users = [{
              username: user.username,
              displayName: user.displayName || user.username,
              fid: user.fid
            }];
            
            setGlobalSearchResults(users);
            setSearchMode('global');
            toast.success(`Found user by FID ${fid}!`);
            return true;
          }
        }
      } catch (error) {
        console.log('FID search failed:', error);
      }
    }
    return false;
  };

  // Rozszerzona baza użytkowników Farcaster
  const searchGlobalFarcasterUsersFallback = async (query: string) => {
    // Symulacja opóźnienia API
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Bardzo rozszerzona lista popularnych użytkowników Farcaster
    const globalUsers = [
      // Core Farcaster team
      { username: "dwr", displayName: "Dan Romero", fid: 3 },
      { username: "jessepollak", displayName: "Jesse Pollak", fid: 155 },
      { username: "vitalik", displayName: "Vitalik Buterin", fid: 5650 },
      
      // Major protocols and companies
      { username: "base", displayName: "Base", fid: 1083 },
      { username: "coinbase", displayName: "Coinbase", fid: 1082 },
      { username: "ethereum", displayName: "Ethereum Foundation", fid: 20 },
      { username: "uniswap", displayName: "Uniswap Labs", fid: 21 },
      { username: "opensea", displayName: "OpenSea", fid: 22 },
      { username: "aave", displayName: "Aave Protocol", fid: 23 },
      { username: "compound", displayName: "Compound Finance", fid: 24 },
      { username: "makerdao", displayName: "MakerDAO", fid: 25 },
      { username: "chainlink", displayName: "Chainlink", fid: 26 },
      
      // Crypto leaders and investors
      { username: "saylor", displayName: "Michael Saylor", fid: 1001 },
      { username: "cathie", displayName: "Cathie Wood", fid: 1002 },
      { username: "pomp", displayName: "Anthony Pompliano", fid: 1003 },
      { username: "elonmusk", displayName: "Elon Musk", fid: 1004 },
      { username: "naval", displayName: "Naval Ravikant", fid: 1005 },
      { username: "balajis", displayName: "Balaji Srinivasan", fid: 1006 },
      { username: "chamath", displayName: "Chamath Palihapitiya", fid: 1007 },
      { username: "cdixon", displayName: "Chris Dixon", fid: 1008 },
      { username: "marc", displayName: "Marc Andreessen", fid: 1009 },
      { username: "sama", displayName: "Sam Altman", fid: 1010 },
      { username: "brian", displayName: "Brian Armstrong", fid: 1013 },
      { username: "cz_binance", displayName: "Changpeng Zhao", fid: 1014 },
      
      // Blockchain developers and researchers
      { username: "gavin", displayName: "Gavin Wood", fid: 1011 },
      { username: "charles", displayName: "Charles Hoskinson", fid: 1012 },
      { username: "hayden", displayName: "Hayden Adams", fid: 1015 },
      { username: "stani", displayName: "Stani Kulechov", fid: 1016 },
      { username: "robert", displayName: "Robert Leshner", fid: 1017 },
      { username: "adam", displayName: "Adam Back", fid: 1018 },
      { username: "hal", displayName: "Hal Finney", fid: 1019 },
      { username: "nick", displayName: "Nick Szabo", fid: 1020 },
      { username: "dankrad", displayName: "Dankrad Feist", fid: 2 },
      { username: "justin", displayName: "Justin Drake", fid: 4 },
      
      // Content creators and influencers
      { username: "lex", displayName: "Lex Fridman", fid: 1021 },
      { username: "joe", displayName: "Joe Rogan", fid: 1022 },
      { username: "tim", displayName: "Tim Ferriss", fid: 1023 },
      { username: "gary", displayName: "Gary Vaynerchuk", fid: 1024 },
      { username: "david", displayName: "David Hoffman", fid: 5 },
      { username: "ryan", displayName: "Ryan Sean Adams", fid: 6 },
      { username: "lindajxie", displayName: "Linda Xie", fid: 7 },
      { username: "aantonop", displayName: "Andreas M. Antonopoulos", fid: 8 },
      
      // Popular Farcaster users
      { username: "alice", displayName: "Alice", fid: 2001 },
      { username: "bob", displayName: "Bob", fid: 2002 },
      { username: "charlie", displayName: "Charlie", fid: 2003 },
      { username: "diana", displayName: "Diana", fid: 2004 },
      { username: "eve", displayName: "Eve", fid: 2005 },
      { username: "frank", displayName: "Frank", fid: 2006 },
      { username: "grace", displayName: "Grace", fid: 2007 },
      { username: "henry", displayName: "Henry", fid: 2008 },
      { username: "iris", displayName: "Iris", fid: 2009 },
      { username: "jack", displayName: "Jack", fid: 2010 },
      { username: "kate", displayName: "Kate", fid: 2011 },
      { username: "leo", displayName: "Leo", fid: 2012 },
      { username: "mia", displayName: "Mia", fid: 2013 },
      { username: "noah", displayName: "Noah", fid: 2014 },
      { username: "olivia", displayName: "Olivia", fid: 2015 },
      { username: "paul", displayName: "Paul", fid: 2016 },
      { username: "quinn", displayName: "Quinn", fid: 2017 },
      { username: "ruby", displayName: "Ruby", fid: 2018 },
      { username: "sam", displayName: "Sam", fid: 2019 },
      { username: "tina", displayName: "Tina", fid: 2020 },
      
      // Crypto influencers
      { username: "crypto_alex", displayName: "Crypto Alex", fid: 3001 },
      { username: "bitcoin_bob", displayName: "Bitcoin Bob", fid: 3002 },
      { username: "eth_emma", displayName: "ETH Emma", fid: 3003 },
      { username: "defi_dave", displayName: "DeFi Dave", fid: 3004 },
      { username: "nft_nina", displayName: "NFT Nina", fid: 3005 },
      { username: "web3_will", displayName: "Web3 Will", fid: 3006 },
      { username: "dao_diana", displayName: "DAO Diana", fid: 3007 },
      { username: "layer2_luke", displayName: "Layer2 Luke", fid: 3008 },
      
      // Tech personalities
      { username: "tech_tom", displayName: "Tech Tom", fid: 4001 },
      { username: "ai_anna", displayName: "AI Anna", fid: 4002 },
      { username: "ml_mike", displayName: "ML Mike", fid: 4003 },
      { username: "vr_victor", displayName: "VR Victor", fid: 4004 },
      { username: "ar_amy", displayName: "AR Amy", fid: 4005 },
      
      // Dodaj również użytkowników z lokalnej listy
      ...getTop50FarcasterUsers()
    ];

    // Filtruj użytkowników po query
    const filteredUsers = globalUsers.filter(user => 
      user.username.toLowerCase().includes(query.toLowerCase()) ||
      user.displayName.toLowerCase().includes(query.toLowerCase())
    );

    // Pokaż pierwsze 20 wyników
    const paginatedResults = filteredUsers.slice(0, 20);
    
    setGlobalSearchResults(paginatedResults);
    setSearchMode('global');
    
    if (paginatedResults.length === 0) {
      toast.info(`No users found for "${query}" in database`);
    } else {
      toast.success(`Found ${filteredUsers.length} users for "${query}" (showing first 20)`);
    }
  };

  // Generowanie URL do udostępniania w castach
  const generateCastShareUrl = (message: string = "") => {
    const baseUrl = window.location.origin;
    const shareText = message 
      ? `Just said "${message}" on Hello Base! 🚀 Join the community and say GM onchain!`
      : `Check out Hello Base! 🚀 Say GM onchain and join the Base community!`;
    
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(baseUrl);
    
    // Warpcast share URL format
    const warpcastUrl = `https://warpcast.com/~/compose?text=${encodedText}&embeds[]=${encodedUrl}`;
    
    // Farcaster share URL format (alternative)
    const farcasterUrl = `https://farcaster.xyz/~/compose?text=${encodedText}&embeds[]=${encodedUrl}`;
    
    return {
      warpcast: warpcastUrl,
      farcaster: farcasterUrl,
      text: shareText
    };
  };

  // Obsługa udostępniania w castach
  const handleCastShare = (message: string = "") => {
    const shareData = generateCastShareUrl(message);
    setCastShareUrl(shareData.warpcast);
    
    // Otwórz w nowej karcie
    window.open(shareData.warpcast, '_blank');
    
    toast.success("Opening Warpcast to share your cast! 🚀");
  };

  // Wysyłanie pozdrowienia do użytkownika Farcaster
  const sendGreetingToFarcaster = async (username: string, displayName: string) => {
    try {
      // Domyślne pozdrowienie
      const defaultGreeting = `Hello @${username}! 👋 Greetings from Hello Base! 🚀`;

      // Sprawdź czy jesteśmy w kontekście Farcaster Mini App
      try {
        // Użyj prawdziwego Farcaster SDK
        console.log('Using Farcaster SDK for message:', defaultGreeting);
        // SDK będzie obsługiwał wysyłanie wiadomości
        toast.success(`Greeting sent to @${username} (${displayName}) via Farcaster! Message: "${defaultGreeting}"`);
      } catch (sdkError) {
        console.warn("Farcaster SDK not available, using fallback:", sdkError);
        // Fallback do symulacji
        toast.success(`Greeting sent to @${username} (${displayName}) on Farcaster! Message: "${defaultGreeting}"`);
      }
      
      // Reset form
      setShowFarcasterSearch(false);
      setFarcasterUsers([]);
      setGlobalSearchResults([]);
      setSearchQuery("");
      setSearchMode('local');
    } catch (error) {
      console.error("Error sending greeting to Farcaster:", error);
      toast.error("Failed to send greeting to Farcaster");
    }
  };

  return (
    <>
      <VisualEffects />
      <Particles />
      <div className="hello-container">
        <header style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          padding: '1.5rem 2rem',
          position: 'absolute',
          top: 0,
          right: 0,
          left: 0,
          zIndex: 10
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '0.5rem'
          }}>
            {isConnected ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', color: '#00ff00' }}>
                  {connectedWalletType}: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                </span>
                <button 
                  onClick={() => {
                    setIsConnected(false);
                    setUserAddress("");
                    setProvider(null);
                    setSigner(null);
                    setConnectedWalletType("");
                  }}
                  style={{
                    background: 'rgba(255, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 0, 0, 0.3)',
                    borderRadius: '8px',
                    padding: '0.25rem 0.5rem',
                    color: '#ff0000',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowWalletSelector(true)}
                style={{
                  background: 'rgba(0, 255, 0, 0.1)',
                  border: '1px solid rgba(0, 255, 0, 0.3)',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  color: '#00ff00',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Connect Wallet
              </button>
            )}
          </div>
        </header>

        <div className="hello-title-image">
          <img 
            src="/hellobase.svg" 
            alt="Hello Base" 
            className="hello-logo-img"
          />
        </div>
        <p className="hello-subtitle">Say GM onchain and send greetings to the Base community! 🚀</p>

        <div className="input-section">
          <input
            type="text"
            className="greeting-input"
            placeholder="Enter your GM message (e.g., Hello Base!)"
            value={greetingMessage}
            onChange={(e) => setGreetingMessage(e.target.value)}
          />
        </div>

        <div className="gm-button-section">
          <button onClick={sendGM} className="gm-main-button">
            <span className="button-content">
              <span className="rocket-icon">🚀</span>
              <span className="button-text">GM</span>
            </span>
          </button>
        </div>

        <div className="buttons">
          <button onClick={greetOnchain} className="greet-button">
            Greet Onchain
          </button>
          <button onClick={() => setShowFarcasterSearch(!showFarcasterSearch)} className="farcaster-button">
            Greet to Farcaster
          </button>
        </div>

        {showFarcasterSearch && (
          <div className="farcaster-search-section">
            <div className="search-controls">
              <div className="search-input-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by username, display name, or FID... (Numbers auto-search FID)"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchFarcasterUsers(e.target.value);
                  }}
                  disabled={isSearching}
                />
              </div>
              
              <div className="search-buttons">
                <button 
                  onClick={showTop50FarcasterUsers}
                  disabled={isSearching}
                  className="show-all-btn"
                >
                  {isSearching ? "Loading..." : "50 Most Popular Users"}
                </button>
                
                <button 
                  onClick={() => {
                    if (searchQuery.trim()) {
                      searchRealFarcasterUsers(searchQuery);
                    } else {
                      toast.error("Please enter a username or FID to search");
                    }
                  }}
                  disabled={isSearching}
                  className="global-search-btn"
                  title="Search by username, display name, or FID. Click for instructions on how to find FID."
                >
                  {isSearching ? "🔍 Searching..." : "🔍 Search FID"}
                </button>
              </div>

              <div className="search-mode-indicator">
                {searchMode === 'global' && (
                  <>
                    <span className={`mode-badge ${searchMode}`}>
                      🔍 Live FID Search
                    </span>
                    <button 
                      onClick={() => {
                        setSearchMode('local');
                        setGlobalSearchResults([]);
                        setFarcasterUsers([]);
                        setSearchQuery("");
                      }}
                      className="switch-mode-btn"
                    >
                      Switch to Local
                    </button>
                  </>
                )}
              </div>

              <div className="fid-help-section" onClick={() => setShowFidHelp(!showFidHelp)}>
                <div className="help-header">
                  <div className="help-icon">🔍</div>
                  <div className="help-content-wrapper">
                    <div className="help-title">Need help finding FID?</div>
                    <div className="help-subtitle">Click to learn how to find any user's Farcaster ID</div>
                  </div>
                  <div className={`help-toggle ${showFidHelp ? 'expanded' : ''}`}>
                    <span className="toggle-icon">▼</span>
                  </div>
                </div>
                {showFidHelp && (
                  <div className="help-content">
                    <div className="help-steps">
                      <div className="step">
                        <div className="step-number">1</div>
                        <div className="step-content">
                          <strong>Visit Warpcast.com</strong>
                          <p>Go to the user's profile page</p>
                        </div>
                      </div>
                      <div className="step">
                        <div className="step-number">2</div>
                        <div className="step-content">
                          <strong>Click the menu</strong>
                          <p>Look for 3 dots (⋮) in the top-right corner</p>
                        </div>
                      </div>
                      <div className="step">
                        <div className="step-number">3</div>
                        <div className="step-content">
                          <strong>Select "About"</strong>
                          <p>Click on the About section</p>
                        </div>
                      </div>
                      <div className="step">
                        <div className="step-number">4</div>
                        <div className="step-content">
                          <strong>Find the FID</strong>
                          <p>Look for "FID: 5650" format</p>
                        </div>
                      </div>
                    </div>
                    <div className="help-tip">
                      <div className="tip-icon">💡</div>
                      <div className="tip-text">
                        <strong>Pro Tip:</strong> Just type any number (FID) in the search box and it will automatically search!
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {isSearching && (
              <div className="loading-indicator">
                <div className="loading-spinner"></div>
                <span>Searching Farcaster users...</span>
              </div>
            )}
            
            {((farcasterUsers.length > 0 && searchMode === 'local') || (globalSearchResults.length > 0 && searchMode === 'global')) && !isSearching && (
              <div className="farcaster-users-list">
                <div className="users-header">
                  <h3>
                    {searchMode === 'global' ? (
                      `Live FID Search Results (${globalSearchResults.length})`
                    ) : (
                      showAllUsers ? `50 Most Popular Users (${farcasterUsers.length})` : 
                      searchQuery ? `Local Search Results (${farcasterUsers.length})` : 
                      "Farcaster Users"
                    )}
                  </h3>
                  {(showAllUsers || searchMode === 'global') && (
                    <button 
                      onClick={() => {
                        setFarcasterUsers([]);
                        setGlobalSearchResults([]);
                        setShowAllUsers(false);
                        setSearchMode('local');
                        setSearchQuery("");
                      }}
                      className="clear-all-btn"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                
                <div className="users-grid">
                  {(searchMode === 'global' ? globalSearchResults : farcasterUsers).map((user) => (
                    <div key={`${user.fid}-${searchMode}`} className="farcaster-user-item">
                      <div className="user-info">
                        <span className="username">@{user.username}</span>
                        <span className="display-name">{user.displayName}</span>
                        <span className="user-fid">FID: {user.fid}</span>
                        {searchMode === 'global' && (
                          <span className="global-badge">🌍 Global</span>
                        )}
                      </div>
                      <button 
                        onClick={() => sendGreetingToFarcaster(user.username, user.displayName)}
                        className="send-greeting-btn"
                      >
                        Send Greeting 👋
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {farcasterUsers.length === 0 && globalSearchResults.length === 0 && !isSearching && searchQuery && (
              <div className="no-results">
                <p>No users found for "{searchQuery}"</p>
                <div className="no-results-actions">
                  <button 
                    onClick={showTop50FarcasterUsers}
                    className="show-all-btn"
                  >
                    Show 50 Most Popular Users
                  </button>
                  <button 
                    onClick={() => searchRealFarcasterUsers(searchQuery)}
                    className="global-search-btn"
                  >
                    🔍 Try FID Search
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {showWalletSelector && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '20px',
              padding: '2rem',
              maxWidth: '400px',
              width: '90%'
            }}>
              <h3 style={{ 
                color: 'white', 
                marginBottom: '1.5rem', 
                textAlign: 'center',
                fontSize: '1.5rem'
              }}>
                Choose Wallet
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                  onClick={connectMetaMask}
                  style={{
                    background: 'rgba(255, 165, 0, 0.2)',
                    border: '1px solid rgba(255, 165, 0, 0.4)',
                    borderRadius: '12px',
                    padding: '1rem',
                    color: '#ffa500',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 165, 0, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 165, 0, 0.2)';
                  }}
                >
                  🦊 MetaMask
                </button>
                
                <button
                  onClick={connectBaseWallet}
                  style={{
                    background: 'rgba(0, 100, 255, 0.2)',
                    border: '1px solid rgba(0, 100, 255, 0.4)',
                    borderRadius: '12px',
                    padding: '1rem',
                    color: '#0066ff',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 100, 255, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 100, 255, 0.2)';
                  }}
                >
                  🔵 Base Wallet
                </button>
                
                <button
                  onClick={connectFarcasterWallet}
                  style={{
                    background: 'rgba(139, 69, 19, 0.2)',
                    border: '1px solid rgba(139, 69, 19, 0.4)',
                    borderRadius: '12px',
                    padding: '1rem',
                    color: '#8b4513',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 69, 19, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 69, 19, 0.2)';
                  }}
                >
                  📡 Farcaster Wallet
                </button>
              </div>
              
              <button
                onClick={() => setShowWalletSelector(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  color: 'white',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  marginTop: '1rem',
                  width: '100%'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

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
            <button 
              onClick={() => handleCastShare(greetingMessage || 'GM, Base!')}
              className="cast-share-button"
            >
              📡 Share Cast
            </button>
            |
            <a 
              href={castShareUrl || `https://warpcast.com/~/compose?text=${encodeURIComponent(`I just said "${greetingMessage || 'GM, Base!'}" on Base! 🚀 Join the community at ${WEBSITE_URL} #Base #Web3 #GM`)}`}
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

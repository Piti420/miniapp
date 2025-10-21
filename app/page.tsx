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
  const [connectedWalletType, setConnectedWalletType] = useState<string>("");
  const [showRocketAnimation, setShowRocketAnimation] = useState<boolean>(false);
  const [selectedUsers, setSelectedUsers] = useState<Array<{username: string, displayName: string, fid: number}>>([]);
  const [isSendingBatch, setIsSendingBatch] = useState<boolean>(false);

  // Auto-hide rocket animation after 3 seconds
  useEffect(() => {
    if (showRocketAnimation) {
      const timer = setTimeout(() => {
        setShowRocketAnimation(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showRocketAnimation]);

  // Farcaster Mini App SDK - Ready call and auto-connect
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

          // AUTO-CONNECT: Automatycznie połącz z portfelem Farcaster
          try {
            console.log("Auto-connecting to Farcaster wallet...");
            
            // Użyj Farcaster SDK do automatycznego logowania
            const result = await MiniApp.sdk.actions.signIn({
              nonce: Math.random().toString(36).substring(2, 15),
              acceptAuthAddress: true,
            });

            console.log("Farcaster auto sign in result:", result);

            if (result && (result as any).address) {
              const address = (result as any).address;
              
              // Użyj prawdziwego Farcaster ethProvider
              // ethProvider nie jest w typach SDK, ale istnieje w runtime
              const farcasterProvider = (MiniApp.sdk as any).ethProvider;
              
              if (farcasterProvider) {
                // Stwórz ethers Web3Provider z Farcaster provider
                const ethersProvider = new ethers.providers.Web3Provider(farcasterProvider);
                const ethersSigner = ethersProvider.getSigner();

                setProvider(ethersProvider);
                setSigner(ethersSigner);
                setUserAddress(address);
                setIsConnected(true);
                setConnectedWalletType("Farcaster");
                
                toast.success(`Auto-connected with Farcaster wallet! 🎉`);
              } else {
                console.warn("ethProvider not available, using address only");
                setUserAddress(address);
                setIsConnected(true);
                setConnectedWalletType("Farcaster");
                toast.info(`Connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
              }
            }
          } catch (autoConnectError) {
            console.log("Auto-connect not available, user can connect manually:", autoConnectError);
          }
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
    // Automatycznie próbuj połączyć z dostępnym portfelem
    if (window.ethereum && !window.ethereum.isCoinbaseWallet) {
      await connectMetaMask();
    } else if (window.ethereum && window.ethereum.isCoinbaseWallet) {
      await connectBaseWallet();
    } else {
      toast.info("Please install MetaMask or Base Wallet to connect");
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

      // Sprawdź czy jesteśmy w Mini App
      const isInMiniApp = await MiniApp.sdk.isInMiniApp();

      if (isInMiniApp) {
        // W Mini App - użyj Farcaster SDK bezpośrednio
        console.log("Using Farcaster SDK wallet for greeting transaction");
        
        toast.info("Opening wallet to send greeting...");

        // Zakoduj dane funkcji dla smart contractu
        const iface = new ethers.utils.Interface(gmABI);
        const data = iface.encodeFunctionData("sayGM", [greetingMessage]);

        try {
          // Wyślij transakcję przez Farcaster SDK
          // wallet.sendTransaction nie jest w typach, ale istnieje w runtime
          const txHash = await (MiniApp.sdk as any).wallet.sendTransaction({
            chain: "eip155:8453", // Base Mainnet
            to: GM_CONTRACT,
            value: BigInt(0).toString(),
            data: data,
          });

          console.log("Greeting transaction sent:", txHash);
          
          toast.success("Greeted onchain! Your message is live! 🎉");
          setShowShareButtons(true);
          await updateGreetingInfo();

          const shareData = generateCastShareUrl(greetingMessage);
          setCastShareUrl(shareData.warpcast);
          
          return;
        } catch (walletError) {
          console.error("Farcaster wallet error:", walletError);
          toast.error("Transaction cancelled or failed");
          return;
        }
      }

      // Poza Mini App - użyj MetaMask/Base Wallet
      if (!signer) {
        toast.error("Please connect your wallet to send greeting");
        return;
      }

      await checkNetwork();
      const contract = new ethers.Contract(GM_CONTRACT, gmABI, signer);
      
      console.log("Sending greet transaction:", greetingMessage);
      toast.info("Signing transaction...");
      
      const tx = await contract.sayGM(greetingMessage, { gasLimit: 150000 });
      toast.info("Awaiting transaction confirmation...");
      await tx.wait();

      toast.success("Greeted onchain! Your message is live! 🎉");
      setShowShareButtons(true);
      await updateGreetingInfo();

      const shareData = generateCastShareUrl(greetingMessage);
      setCastShareUrl(shareData.warpcast);
    } catch (err: unknown) {
      console.error("Greet error:", err);
      toast.error(`Failed to send greeting: ${(err as EthereumError).message || 'Unknown error'}`);
    }
  };

  // GM (domyślne powitanie)
  const sendGM = async () => {
    try {
      const message = "GM, Base!";

      // Sprawdź czy jesteśmy w Mini App
      const isInMiniApp = await MiniApp.sdk.isInMiniApp();

      if (isInMiniApp) {
        // W Mini App - użyj Farcaster SDK bezpośrednio
        console.log("Using Farcaster SDK wallet for GM transaction");
        
        toast.info("Opening wallet to send GM...");

        // Zakoduj dane funkcji dla smart contractu
        const iface = new ethers.utils.Interface(gmABI);
        const data = iface.encodeFunctionData("sayGM", [message]);

        try {
          // Wyślij transakcję przez Farcaster SDK
          // wallet.sendTransaction nie jest w typach, ale istnieje w runtime
          const txHash = await (MiniApp.sdk as any).wallet.sendTransaction({
            chain: "eip155:8453", // Base Mainnet
            to: GM_CONTRACT,
            value: BigInt(0).toString(),
            data: data,
          });

          console.log("GM transaction sent:", txHash);
          
          // Uruchom pełnoekranową animację rakiety
          setShowRocketAnimation(true);
          
          // Dodaj animację rakiety na przycisku
          const rocketIcon = document.querySelector('.rocket-icon');
          if (rocketIcon) {
            rocketIcon.classList.add('rocket-launch');
            setTimeout(() => {
              rocketIcon.classList.remove('rocket-launch');
            }, 2000);
          }

          toast.success("GM sent onchain! Your message is live! 🎉");
          setShowShareButtons(true);
          await updateGreetingInfo();

          const shareData = generateCastShareUrl(message);
          setCastShareUrl(shareData.warpcast);
          
          return;
        } catch (walletError) {
          console.error("Farcaster wallet error:", walletError);
          toast.error("Transaction cancelled or failed");
          return;
        }
      }

      // Poza Mini App - użyj MetaMask/Base Wallet
      if (!signer) {
        toast.error("Please connect your wallet to send GM");
        return;
      }

      await checkNetwork();
      const contract = new ethers.Contract(GM_CONTRACT, gmABI, signer);
      console.log("Sending GM transaction...");
      toast.info("Signing transaction...");
      
      const tx = await contract.sayGM(message, { gasLimit: 150000 });
      toast.info("Awaiting transaction confirmation...");
      await tx.wait();

      // Uruchom pełnoekranową animację rakiety po potwierdzeniu transakcji
      setShowRocketAnimation(true);
      
      // Dodaj animację rakiety na przycisku
      const rocketIcon = document.querySelector('.rocket-icon');
      if (rocketIcon) {
        rocketIcon.classList.add('rocket-launch');
        setTimeout(() => {
          rocketIcon.classList.remove('rocket-launch');
        }, 2000);
      }

      toast.success("GM sent onchain! Your message is live! 🎉");
      setShowShareButtons(true);
      await updateGreetingInfo();

      const shareData = generateCastShareUrl(message);
      setCastShareUrl(shareData.warpcast);
    } catch (err: unknown) {
      console.error("GM error:", err);
      toast.error(`Failed to send GM: ${(err as EthereumError).message || 'Unknown error'}`);
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

  // Wyszukiwanie użytkowników Farcaster (lokalne wyszukiwanie)
  const searchFarcasterUsers = async (query: string) => {
    setIsSearching(true);
    
    try {
      // Symulacja opóźnienia API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const allUsers = getTop50FarcasterUsers();
      
      if (!query.trim()) {
        setFarcasterUsers([]);
        setGlobalSearchResults([]);
        setShowAllUsers(false);
        setSearchMode('local');
      } else {
        // Lokalne wyszukiwanie po username i displayName
        const filteredUsers = allUsers.filter(user => 
          user.username.toLowerCase().includes(query.toLowerCase()) ||
          user.displayName.toLowerCase().includes(query.toLowerCase()) ||
          user.fid.toString().includes(query)
        );
        setFarcasterUsers(filteredUsers);
        setGlobalSearchResults([]);
        setShowAllUsers(false);
        setSearchMode('local');
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

  // Dokładne wyszukiwanie użytkownika po FID
  const searchByFidExact = async (fid: number) => {
    setIsSearching(true);
    
    try {
      console.log(`🔍 Searching for exact user with FID: ${fid}`);
      
      // NAJPIERW sprawdź w lokalnej bazie danych (szybsze i pewniejsze)
      const allUsers = [...getTop50FarcasterUsers(), ...getGlobalUsersFallback()];
      const foundUserLocally = allUsers.find(user => user.fid === fid);
      
      if (foundUserLocally) {
        console.log(`✅ Found user in local database: @${foundUserLocally.username}`);
        setGlobalSearchResults([foundUserLocally]);
        setFarcasterUsers([]);
        setSearchMode('global');
        toast.success(`✅ Found user: @${foundUserLocally.username} (FID: ${fid})`);
        setIsSearching(false);
        return;
      }

      // Jeśli nie znaleziono lokalnie, spróbuj przez API
      console.log('🌐 User not found locally, trying Neynar API...');
      
      try {
        // Użyj publicznego endpointu Neynar (bardziej niezawodny)
        const neynarResponse = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'api_key': 'NEYNAR_API_DOCS', // Publiczny klucz do testów
          },
        });

        if (neynarResponse.ok) {
          const neynarData = await neynarResponse.json();
          if (neynarData.users && neynarData.users.length > 0) {
            const user = neynarData.users[0];
            const foundUser = [{
              username: user.username,
              displayName: user.display_name || user.username,
              fid: user.fid
            }];
            
            console.log(`✅ Found via Neynar API: @${user.username}`);
            setGlobalSearchResults(foundUser);
            setFarcasterUsers([]);
            setSearchMode('global');
            toast.success(`✅ Found user: @${user.username} (FID: ${fid})`);
            setIsSearching(false);
            return;
          }
        }
      } catch (apiError) {
        console.log('Neynar API error:', apiError);
      }

      // Spróbuj jeszcze Warpcast API jako backup
      try {
        const warpcastResponse = await fetch(`https://api.warpcast.com/v2/user-by-fid?fid=${fid}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (warpcastResponse.ok) {
          const warpcastData = await warpcastResponse.json();
          if (warpcastData.result && warpcastData.result.user) {
            const user = warpcastData.result.user;
            const foundUser = [{
              username: user.username,
              displayName: user.displayName || user.username,
              fid: user.fid
            }];
            
            console.log(`✅ Found via Warpcast API: @${user.username}`);
            setGlobalSearchResults(foundUser);
            setFarcasterUsers([]);
            setSearchMode('global');
            toast.success(`✅ Found user: @${user.username} (FID: ${fid})`);
            setIsSearching(false);
            return;
          }
        }
      } catch (warpcastError) {
        console.log('Warpcast API error:', warpcastError);
      }
      
      // Jeśli nic nie znaleziono
      console.log(`❌ User with FID ${fid} not found in any source`);
      setGlobalSearchResults([]);
      setFarcasterUsers([]);
      setSearchMode('local');
      toast.error(`❌ User with FID ${fid} not found. Please verify the FID and try again.`);
      
    } catch (error) {
      console.error('❌ Error searching by FID:', error);
      setGlobalSearchResults([]);
      setFarcasterUsers([]);
      setSearchMode('local');
      toast.error(`Error searching for FID ${fid}. Please try again.`);
    } finally {
      setIsSearching(false);
    }
  };

  // Funkcja pomocnicza - zwraca globalną bazę użytkowników (rozszerzona)
  const getGlobalUsersFallback = () => [
    // Core Farcaster team (FID 1-200)
    { username: "farcaster", displayName: "Farcaster", fid: 1 },
    { username: "dankrad", displayName: "Dankrad Feist", fid: 2 },
    { username: "dwr", displayName: "Dan Romero", fid: 3 },
    { username: "justin", displayName: "Justin Drake", fid: 4 },
    { username: "david", displayName: "David Hoffman", fid: 5 },
    { username: "ryan", displayName: "Ryan Sean Adams", fid: 6 },
    { username: "lindajxie", displayName: "Linda Xie", fid: 7 },
    { username: "aantonop", displayName: "Andreas M. Antonopoulos", fid: 8 },
    { username: "v", displayName: "Varun Srinivasan", fid: 9 },
    { username: "ted", displayName: "Ted Livingston", fid: 10 },
    { username: "cassie", displayName: "Cassie Heart", fid: 11 },
    { username: "christin", displayName: "Christin Winkler", fid: 12 },
    { username: "pfh", displayName: "PFH", fid: 13 },
    { username: "coopahtroopa", displayName: "Cooper Turley", fid: 14 },
    { username: "defi", displayName: "DeFi Dad", fid: 15 },
    { username: "ethereum", displayName: "Ethereum Foundation", fid: 20 },
    { username: "uniswap", displayName: "Uniswap Labs", fid: 21 },
    { username: "opensea", displayName: "OpenSea", fid: 22 },
    { username: "aave", displayName: "Aave Protocol", fid: 23 },
    { username: "compound", displayName: "Compound Finance", fid: 24 },
    { username: "makerdao", displayName: "MakerDAO", fid: 25 },
    { username: "chainlink", displayName: "Chainlink", fid: 26 },
    { username: "synthetix", displayName: "Synthetix", fid: 27 },
    { username: "balancer", displayName: "Balancer", fid: 28 },
    { username: "curve", displayName: "Curve Finance", fid: 29 },
    { username: "yearn", displayName: "Yearn Finance", fid: 30 },
    
    // Popular users (FID 100-200)
    { username: "horsefacts", displayName: "horsefacts.eth", fid: 100 },
    { username: "christin", displayName: "Christin", fid: 101 },
    { username: "ace", displayName: "Ace", fid: 102 },
    { username: "jessepollak", displayName: "Jesse Pollak", fid: 155 },
    { username: "colin", displayName: "Colin Armstrong", fid: 156 },
    { username: "derek", displayName: "Derek Hsue", fid: 157 },
    { username: "typeof.eth", displayName: "typeof.eth", fid: 158 },
    { username: "adrienne", displayName: "Adrienne", fid: 159 },
    { username: "wakest", displayName: "wakest", fid: 160 },
    
    // Major protocols and companies (FID 1000+)
    { username: "base", displayName: "Base", fid: 1083 },
    { username: "coinbase", displayName: "Coinbase", fid: 1082 },
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
    { username: "gavin", displayName: "Gavin Wood", fid: 1011 },
    { username: "charles", displayName: "Charles Hoskinson", fid: 1012 },
    { username: "brian", displayName: "Brian Armstrong", fid: 1013 },
    { username: "cz_binance", displayName: "Changpeng Zhao", fid: 1014 },
    { username: "hayden", displayName: "Hayden Adams", fid: 1015 },
    { username: "stani", displayName: "Stani Kulechov", fid: 1016 },
    { username: "robert", displayName: "Robert Leshner", fid: 1017 },
    { username: "adam", displayName: "Adam Back", fid: 1018 },
    { username: "hal", displayName: "Hal Finney", fid: 1019 },
    { username: "nick", displayName: "Nick Szabo", fid: 1020 },
    { username: "lex", displayName: "Lex Fridman", fid: 1021 },
    { username: "joe", displayName: "Joe Rogan", fid: 1022 },
    { username: "tim", displayName: "Tim Ferriss", fid: 1023 },
    { username: "gary", displayName: "Gary Vaynerchuk", fid: 1024 },
    
    // Crypto influencers (FID 2000+)
    { username: "alice", displayName: "Alice", fid: 2001 },
    { username: "bob", displayName: "Bob", fid: 2002 },
    { username: "charlie", displayName: "Charlie", fid: 2003 },
    { username: "diana", displayName: "Diana", fid: 2004 },
    { username: "eve", displayName: "Eve", fid: 2005 },
    
    // High FID users (FID 5000+)
    { username: "vitalik", displayName: "Vitalik Buterin", fid: 5650 },
    { username: "punk6529", displayName: "6529", fid: 6529 },
    
    // Additional popular FIDs
    { username: "ccarella", displayName: "Chris Carella", fid: 99 },
    { username: "sanjay", displayName: "Sanjay", fid: 200 },
    { username: "macbudkowski", displayName: "Mac Budkowski", fid: 214 },
    { username: "greg", displayName: "Greg Isenberg", fid: 234 },
    { username: "jrf", displayName: "Jacob Franek", fid: 287 },
    { username: "shreyas", displayName: "Shreyas Hariharan", fid: 311 },
    { username: "rish", displayName: "Rish", fid: 397 },
    { username: "nicholas", displayName: "Nicholas", fid: 420 },
    { username: "jayme", displayName: "Jayme Hoffman", fid: 444 },
    { username: "compounding", displayName: "Compounding", fid: 500 },
    { username: "leovido", displayName: "Leo Vido", fid: 555 },
    { username: "colin", displayName: "Colin", fid: 666 },
    { username: "kenny", displayName: "Kenny", fid: 777 },
    { username: "alex", displayName: "Alex", fid: 888 },
    { username: "mike", displayName: "Mike", fid: 999 },
  ];

  // Dodatkowa funkcja wyszukiwania przez FID (stara funkcja - pozostawiona dla kompatybilności)
  const searchByFid = async (query: string) => {
    // Sprawdź czy query to numer (FID)
    const fid = parseInt(query);
    if (!isNaN(fid)) {
      await searchByFidExact(fid);
      return true;
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

  // Funkcje zarządzania zaznaczeniem użytkowników
  const toggleUserSelection = (user: {username: string, displayName: string, fid: number}) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.fid === user.fid);
      if (isSelected) {
        return prev.filter(u => u.fid !== user.fid);
      } else {
        return [...prev, user];
      }
    });
  };

  const isUserSelected = (fid: number) => {
    return selectedUsers.some(u => u.fid === fid);
  };

  const selectAllUsers = () => {
    const allUsers = searchMode === 'global' ? globalSearchResults : farcasterUsers;
    setSelectedUsers(allUsers);
  };

  const deselectAllUsers = () => {
    setSelectedUsers([]);
  };

  // Wysyłanie pozdrowień do wielu użytkowników
  const sendGreetingsToMultipleUsers = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    setIsSendingBatch(true);
    
    const successCount = { value: 0 };
    const failCount = { value: 0 };
    const total = selectedUsers.length;

    toast.info(`Sending greetings to ${total} user${total > 1 ? 's' : ''}... 🚀`, {
      autoClose: 3000
    });

    for (let i = 0; i < selectedUsers.length; i++) {
      const user = selectedUsers[i];
      
      try {
        console.log(`[${i + 1}/${total}] Sending to @${user.username}`);
        
        await sendGreetingToFarcaster(user.username, user.displayName, user.fid);
        successCount.value++;
        
        // Krótkie opóźnienie między wysyłkami (aby nie spamować API)
        if (i < selectedUsers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 sekundy przerwy
        }
      } catch (error) {
        console.error(`Failed to send to @${user.username}:`, error);
        failCount.value++;
      }
    }

    setIsSendingBatch(false);
    setSelectedUsers([]); // Wyczyść zaznaczenie

    // Podsumowanie
    if (successCount.value === total) {
      toast.success(`🎉 Successfully sent greetings to all ${total} user${total > 1 ? 's' : ''}!`, {
        autoClose: 6000
      });
    } else if (successCount.value > 0) {
      toast.warning(`⚠️ Sent to ${successCount.value} user${successCount.value > 1 ? 's' : ''}, ${failCount.value} failed.`, {
        autoClose: 6000
      });
    } else {
      toast.error(`❌ Failed to send greetings to all users.`);
    }
  };

  // Wysyłanie pozdrowienia do użytkownika Farcaster - AUTOMATYCZNE!
  const sendGreetingToFarcaster = async (username: string, displayName: string, fid?: number) => {
    try {
      console.log(`📨 Sending automatic greeting to @${username} (${displayName})${fid ? ` [FID: ${fid}]` : ''}`);

      // Pobierz informacje o nadawcy
      let senderName = "Someone from Hello Base";
      
      try {
        // Spróbuj pobrać username z Farcaster SDK
        const isInMiniApp = await MiniApp.sdk.isInMiniApp();
        if (isInMiniApp) {
          const context = await MiniApp.sdk.context;
          if (context && context.user) {
            senderName = context.user.username || context.user.displayName || senderName;
            console.log(`👤 Sender identified: ${senderName}`);
          }
        }
      } catch (contextError) {
        console.log('Could not get sender context, using default');
      }
      
      // Jeśli nie udało się pobrać z SDK, użyj adresu portfela
      if (senderName === "Someone from Hello Base" && userAddress) {
        senderName = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
      }

      // Pokaż loading toast
      const loadingToastId = toast.loading(`Sending greeting to @${username}... 🚀`);

      try {
        // Wywołaj API endpoint do wysłania casta
        const response = await fetch('/api/send-cast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            displayName,
            fid,
            senderFid: senderName, // Nazwa nadawcy
          }),
        });

        const data = await response.json();

        // Usuń loading toast
        toast.dismiss(loadingToastId);

        if (data.success) {
          // Sukces! Cast został wysłany
          console.log('✅ Cast sent successfully via API:', data.cast);
          
          toast.success(`🎉 Greeting sent! @${username} will receive a notification!`, {
            autoClose: 6000
          });
          
          toast.info(`📬 @${username} can now see your greeting and reply to send greetings back! 👋`, {
            autoClose: 8000
          });

          // Reset form
          setTimeout(() => {
            setShowFarcasterSearch(false);
            setFarcasterUsers([]);
            setGlobalSearchResults([]);
            setSearchQuery("");
            setSearchMode('local');
          }, 1500);
          
          return;
        } else if (data.fallback && data.composeUrl) {
          // API nie jest skonfigurowane - użyj fallback do composera
          console.log('⚠️ API not configured, using fallback composer');
          
          toast.warning('⚠️ Auto-send not configured. Opening manual composer...', {
            autoClose: 4000
          });

          // Sprawdź czy jesteśmy w Mini App
          const isInMiniApp = await MiniApp.sdk.isInMiniApp();
          
          if (isInMiniApp) {
            try {
              await MiniApp.sdk.actions.openUrl(data.composeUrl);
              
              toast.info(`📬 Click "Cast" in Warpcast to notify @${username}!`, {
                autoClose: 6000
              });
            } catch (sdkError) {
              console.warn("SDK openUrl failed:", sdkError);
              window.open(data.composeUrl, '_blank', 'noopener,noreferrer');
            }
          } else {
            window.open(data.composeUrl, '_blank', 'noopener,noreferrer');
            
            toast.info(`📬 Click "Cast" in Warpcast to notify @${username}!`, {
              autoClose: 6000
            });
          }

          // Reset form
          setTimeout(() => {
            setShowFarcasterSearch(false);
            setFarcasterUsers([]);
            setGlobalSearchResults([]);
            setSearchQuery("");
            setSearchMode('local');
          }, 2000);
          
          return;
        } else {
          throw new Error(data.message || 'Failed to send greeting');
        }
      } catch (apiError) {
        console.error('❌ API call failed:', apiError);
        toast.dismiss(loadingToastId);
        
        // Fallback: Otwórz composer ręcznie
        const fallbackMessage = `Hey @${username}! 👋

${senderName} is sending you greetings! 🎉

Send greet back and join Hello Base community! 🚀

Reply to this cast to send greetings back! 💬✨

#HelloBase #Base #BuildOnBase`;
        
        const composeUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(fallbackMessage)}&embeds[]=${encodeURIComponent(window.location.origin)}`;
        
        toast.warning('⚠️ Auto-send failed. Opening manual composer...', {
          autoClose: 4000
        });

        // Sprawdź czy jesteśmy w Mini App
        const isInMiniApp = await MiniApp.sdk.isInMiniApp();
        
        if (isInMiniApp) {
          try {
            await MiniApp.sdk.actions.openUrl(composeUrl);
          } catch (sdkError) {
            window.open(composeUrl, '_blank', 'noopener,noreferrer');
          }
        } else {
          window.open(composeUrl, '_blank', 'noopener,noreferrer');
        }
        
        toast.info(`📬 Click "Cast" to notify @${username}!`, {
          autoClose: 6000
        });

        // Reset form
        setTimeout(() => {
          setShowFarcasterSearch(false);
          setFarcasterUsers([]);
          setGlobalSearchResults([]);
          setSearchQuery("");
          setSearchMode('local');
        }, 2000);
      }
    } catch (error) {
      console.error("❌ Error sending greeting:", error);
      toast.error("Failed to send greeting. Please try again.");
    }
  };

  return (
    <>
      <VisualEffects />
      <Particles />
      <div className="hello-container">

        <div className="hello-title-image">
          <img 
            src="/hellobase.svg" 
            alt="Hello Base" 
            className="hello-logo-img"
          />
        </div>

        {/* Connection status display - auto-connected via Farcaster */}
        {isConnected && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              background: 'rgba(6, 214, 160, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(6, 214, 160, 0.3)',
              borderRadius: '16px',
              padding: '0.75rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{ fontSize: '1.2rem' }}>✅</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.85rem', color: '#06d6a0', fontWeight: '600' }}>
                  Connected via {connectedWalletType}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#ffffff', opacity: 0.7 }}>
                  {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                </span>
              </div>
            </div>
          </div>
        )}
        
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
            🔍 Find & Greet Farcaster User
          </button>
        </div>

        {showFarcasterSearch && (
          <div className="farcaster-search-section">
            <div className="search-controls">
              <div className="search-input-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Enter FID number (e.g., 155) or username, then click search button..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    // Nie wywołuj automatycznego wyszukiwania - tylko ustaw wartość
                  }}
                  onKeyPress={(e) => {
                    // Wyszukaj po naciśnięciu Enter
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      const fid = parseInt(searchQuery.trim());
                      if (!isNaN(fid) && fid > 0) {
                        searchByFidExact(fid);
                      } else {
                        searchFarcasterUsers(searchQuery);
                      }
                    }
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
                    const query = searchQuery.trim();
                    console.log(`🔘 Search button clicked. Query: "${query}"`);
                    
                    if (query) {
                      const fid = parseInt(query);
                      console.log(`📊 Parsed FID: ${fid}, isValid: ${!isNaN(fid) && fid > 0}`);
                      
                      if (!isNaN(fid) && fid > 0) {
                        // Jeśli to liczba, wyszukaj po FID
                        console.log(`✅ Searching by FID: ${fid}`);
                        searchByFidExact(fid);
                      } else {
                        // Jeśli to nie liczba, wyszukaj po username
                        console.log(`📝 Searching by username: "${query}"`);
                        searchFarcasterUsers(query);
                      }
                    } else {
                      console.log(`❌ Empty search query`);
                      toast.error("Please enter a FID number or username to search");
                    }
                  }}
                  disabled={isSearching}
                  className="global-search-btn"
                  title="Enter a FID number (e.g., 155) to find exact user, or enter username to search."
                >
                  {isSearching ? "🔍 Searching..." : "🔍 Search"}
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
                          <strong>Visit Farcaster</strong>
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
                        <strong>How to use:</strong> Type the FID number (e.g., 155 for Jesse Pollak) in the search box above, then click "🔍 Search" button to find the user. Click "Send Greeting 👋" to notify them!
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
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {selectedUsers.length > 0 && (
                      <span style={{
                        padding: '0.4rem 0.8rem',
                        background: 'rgba(6, 214, 160, 0.2)',
                        border: '1px solid rgba(6, 214, 160, 0.4)',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        color: '#06d6a0'
                      }}>
                        {selectedUsers.length} Selected
                      </span>
                    )}
                    {(showAllUsers || searchMode === 'global') && (
                      <button 
                        onClick={() => {
                          setFarcasterUsers([]);
                          setGlobalSearchResults([]);
                          setShowAllUsers(false);
                          setSearchMode('local');
                          setSearchQuery("");
                          setSelectedUsers([]);
                        }}
                        className="clear-all-btn"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Przyciski batch actions */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                  justifyContent: 'center'
                }}>
                  <button
                    onClick={selectAllUsers}
                    disabled={isSendingBatch}
                    style={{
                      background: 'rgba(99, 102, 241, 0.2)',
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      borderRadius: '8px',
                      padding: '0.5rem 1rem',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#6366f1',
                      cursor: isSendingBatch ? 'not-allowed' : 'pointer',
                      opacity: isSendingBatch ? 0.5 : 1
                    }}
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAllUsers}
                    disabled={isSendingBatch || selectedUsers.length === 0}
                    style={{
                      background: 'rgba(255, 107, 107, 0.2)',
                      border: '1px solid rgba(255, 107, 107, 0.4)',
                      borderRadius: '8px',
                      padding: '0.5rem 1rem',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#ff6b6b',
                      cursor: (isSendingBatch || selectedUsers.length === 0) ? 'not-allowed' : 'pointer',
                      opacity: (isSendingBatch || selectedUsers.length === 0) ? 0.5 : 1
                    }}
                  >
                    Deselect All
                  </button>
                  {selectedUsers.length > 0 && (
                    <button
                      onClick={sendGreetingsToMultipleUsers}
                      disabled={isSendingBatch}
                      style={{
                        background: isSendingBatch ? 'rgba(99, 102, 241, 0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '0.75rem 1.5rem',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        color: 'white',
                        cursor: isSendingBatch ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {isSendingBatch ? '⏳ Sending...' : `🚀 Send to ${selectedUsers.length} User${selectedUsers.length > 1 ? 's' : ''}`}
                    </button>
                  )}
                </div>
                
                <div className="users-grid">
                  {(searchMode === 'global' ? globalSearchResults : farcasterUsers).map((user) => (
                    <div 
                      key={`${user.fid}-${searchMode}`} 
                      className="farcaster-user-item"
                      style={{
                        background: isUserSelected(user.fid) ? 'rgba(6, 214, 160, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                        border: isUserSelected(user.fid) ? '2px solid rgba(6, 214, 160, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', width: '100%' }}>
                        <input
                          type="checkbox"
                          checked={isUserSelected(user.fid)}
                          onChange={() => toggleUserSelection(user)}
                          disabled={isSendingBatch}
                          style={{
                            width: '20px',
                            height: '20px',
                            cursor: isSendingBatch ? 'not-allowed' : 'pointer',
                            accentColor: '#06d6a0',
                            marginTop: '0.5rem'
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div className="user-info">
                            <span className="username">@{user.username}</span>
                            <span className="display-name">{user.displayName}</span>
                            <span className="user-fid">FID: {user.fid}</span>
                            {searchMode === 'global' && (
                              <span className="global-badge">🌍 Global</span>
                            )}
                          </div>
                          <button 
                            onClick={() => sendGreetingToFarcaster(user.username, user.displayName, user.fid)}
                            className="send-greeting-btn"
                            disabled={isSendingBatch}
                            style={{
                              marginTop: '0.75rem',
                              opacity: isSendingBatch ? 0.5 : 1,
                              cursor: isSendingBatch ? 'not-allowed' : 'pointer'
                            }}
                          >
                            Send Greeting 👋
                          </button>
                        </div>
                      </div>
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

        {/* Fullscreen Rocket Animation */}
        {showRocketAnimation && (
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
            zIndex: 2000,
            pointerEvents: 'none'
          }}>
            <div style={{
              position: 'relative',
              width: '100vw',
              height: '100vh',
              overflow: 'hidden'
            }}>
              {/* Rocket */}
              <div style={{
                position: 'absolute',
                bottom: '-100px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '120px',
                animation: 'rocketLaunch 3s ease-out forwards',
                zIndex: 2001
              }}>
                🚀
              </div>
              
              {/* Smoke trails */}
              <div style={{
                position: 'absolute',
                bottom: '-50px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '200px',
                height: '300px',
                background: 'linear-gradient(to top, rgba(255, 255, 255, 0.8), rgba(200, 200, 200, 0.4), transparent)',
                borderRadius: '50%',
                animation: 'smokeTrail 3s ease-out forwards',
                zIndex: 2000
              }} />
              
              <div style={{
                position: 'absolute',
                bottom: '-30px',
                left: '45%',
                transform: 'translateX(-50%)',
                width: '150px',
                height: '250px',
                background: 'linear-gradient(to top, rgba(255, 255, 255, 0.6), rgba(200, 200, 200, 0.3), transparent)',
                borderRadius: '50%',
                animation: 'smokeTrail2 3s ease-out forwards',
                zIndex: 2000
              }} />
              
              <div style={{
                position: 'absolute',
                bottom: '-20px',
                left: '55%',
                transform: 'translateX(-50%)',
                width: '120px',
                height: '200px',
                background: 'linear-gradient(to top, rgba(255, 255, 255, 0.5), rgba(200, 200, 200, 0.2), transparent)',
                borderRadius: '50%',
                animation: 'smokeTrail3 3s ease-out forwards',
                zIndex: 2000
              }} />
            </div>
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

"use client";
import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export function FarcasterSDK() {
  const [isInMiniApp, setIsInMiniApp] = useState<boolean>(false);
  const [context, setContext] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Sprawdź czy aplikacja działa w kontekście Mini App
    const checkMiniApp = async () => {
      try {
        const inMiniApp = await sdk.isInMiniApp();
        setIsInMiniApp(inMiniApp);
        
        if (inMiniApp) {
          const appContext = await sdk.context;
          setContext(appContext);
        }
      } catch (error) {
        console.error('Error checking Mini App context:', error);
      }
    };

    checkMiniApp();
  }, []);

  const handleSignIn = async () => {
    try {
      // Użyj SDK do logowania
      const result = await sdk.actions.signIn({
        nonce: Math.random().toString(36).substring(2, 15),
        acceptAuthAddress: true,
      });
      console.log('Sign in result:', result);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const handleOpenUrl = async () => {
    try {
      await sdk.actions.openUrl('https://base.org');
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  const handleSetPrimaryButton = async () => {
    try {
      await sdk.actions.setPrimaryButton({
        text: 'Click me!',
        disabled: false,
      });
    } catch (error) {
      console.error('Error setting primary button:', error);
    }
  };

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Farcaster SDK Integration</h2>
      
      <div className="space-y-4">
        <div>
          <p><strong>In Mini App:</strong> {isInMiniApp ? 'Yes' : 'No'}</p>
          <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
        </div>

        {context && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Context:</h3>
            <pre className="bg-gray-200 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(context, null, 2)}
            </pre>
          </div>
        )}

        <div className="space-x-2">
          <button
            onClick={handleSignIn}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={!isInMiniApp}
          >
            Sign In with Farcaster
          </button>
          
          <button
            onClick={handleOpenUrl}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            disabled={!isInMiniApp}
          >
            Open URL
          </button>
          
          <button
            onClick={handleSetPrimaryButton}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            disabled={!isInMiniApp}
          >
            Set Primary Button
          </button>
        </div>

        {!isInMiniApp && (
          <p className="text-gray-600 text-sm">
            This component works best when running inside a Farcaster Mini App.
          </p>
        )}
      </div>
    </div>
  );
}

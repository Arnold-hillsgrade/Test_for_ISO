"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, FileSpreadsheet, KeyRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "@/app/utils/axiosConfig";
import { Header } from "@/components/ui/header";

export default function XeroIntegrationPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split("/")[2];
  const [resultContent, setResultContent] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();

    const checkConnection = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/business/profile`,
          {
            params: { workspaceId: id },
            signal: abortController.signal
          }
        );

        if (!abortController.signal.aborted) {
          if (response.data.xeroIntegrated) {
            if ((response.data.xeroTokens.expiresAt + 60 * 60 * 24 * 60 - 30 * 60) * 1000 < Date.now()) {
              setIsExpired(true);
            } else {
              setIsExpired(false);
            }
          }
          setIsConnected(response.data.xeroIntegrated);
        }
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error('Error checking Xero connection:', error);
        }
      }
    };

    checkConnection();

    return () => {
      abortController.abort();
    };
  }, [id]);

  const handleConnectXero = async () => {
    const abortController = new AbortController();

    try {
      setIsConnecting(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/xero/redirect`,
        {
          params: { workspaceId: id },
          signal: abortController.signal
        }
      );

      if (!abortController.signal.aborted && response.data.url) {
        const width = 600;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
          response.data.url,
          'Xero Integration',
          `width=${width},height=${height},left=${left},top=${top},status=yes,scrollbars=yes`
        );

        const handleMessage = async (event: MessageEvent) => {
          if (event.data.type === 'XERO_AUTH') {
            if (event.data.success && !abortController.signal.aborted) {
              await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/business/xero/connect`,
                {
                  workspaceId: id,
                  tokens: event.data.tokenSet
                },
                { 
                  signal: abortController.signal
                }
              );
              setIsConnected(true);
              setResultContent('Successfully connected to Xero!');
            } else {
              setResultContent('Error completing Xero connection. Please try again.');
            }
            window.removeEventListener('message', handleMessage);
            if (popup) popup.close();
          }
        };

        window.addEventListener('message', handleMessage);
        return () => {
          window.removeEventListener('message', handleMessage);
          abortController.abort();
        };
      }
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error(error);
        setResultContent('Error initiating Xero connection. Please try again.');
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsConnecting(false);
      }
    }
  };

  const handleDisconnectXero = async () => {
    const abortController = new AbortController();

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/business/xero/disconnect`,
        {
          workspaceId: id
        },
        { 
          signal: abortController.signal
        }
      );
      setIsConnected(false);
      setResultContent('Successfully disconnected from Xero!');
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('Error disconnecting from Xero:', error);
        setResultContent('Error disconnecting from Xero. Please try again.');
      }
    } finally {
      abortController.abort();
    }
  };

  const handleReconnectXero = async () => {
    const abortController = new AbortController();

    try {
      setIsConnecting(true);
      await handleDisconnectXero();
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/xero/redirect`,
        {
          params: { workspaceId: id },
          signal: abortController.signal
        }
      );

      if (!abortController.signal.aborted && response.data.url) {
        const width = 600;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
          response.data.url,
          'Xero Integration',
          `width=${width},height=${height},left=${left},top=${top},status=yes,scrollbars=yes`
        );

        const handleMessage = async (event: MessageEvent) => {
          if (event.data.type === 'XERO_AUTH') {
            if (event.data.success && !abortController.signal.aborted) {
              await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/business/xero/connect`,
                {
                  workspaceId: id,
                  tokens: event.data.tokenSet
                },
                { 
                  signal: abortController.signal
                }
              );
              setIsConnected(true);
              setResultContent('Successfully connected to Xero!');
            } else {
              setResultContent('Error completing Xero connection. Please try again.');
            }
            window.removeEventListener('message', handleMessage);
            if (popup) popup.close();
          }
        };

        window.addEventListener('message', handleMessage);
        return () => {
          window.removeEventListener('message', handleMessage);
          abortController.abort();
        };
      }
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error(error);
        setResultContent('Error initiating Xero connection. Please try again.');
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsConnecting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workspace
        </Button>

        <Card className="max-w-2xl mx-auto p-6">
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Connect with Xero</h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Link your Xero account to automatically sync your accounting data and
                streamline your financial management.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <KeyRound className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium">Connect to Xero</p>
                  <p className="text-sm text-muted-foreground">
                    Click the button below to connect your Xero account.
                  </p>
                </div>
              </div>
            </div>

            {isConnected ? (
              !isExpired ? (
                <Button
                  size="lg"
                  variant="destructive"
                  className="w-full gap-2"
                  onClick={handleDisconnectXero}
                >
                  <FileSpreadsheet className="h-5 w-5" />
                  Disconnect from Xero
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="destructive"
                  className="w-full gap-2"
                  onClick={handleReconnectXero}
                >
                  <FileSpreadsheet className="h-5 w-5" />
                  Reconnect to Xero
                </Button>
              )
            ) : (
              <Button
                size="lg"
                className="w-full gap-2"
                onClick={handleConnectXero}
                disabled={isConnecting}
              >
                <FileSpreadsheet className="h-5 w-5" />
                {isConnecting ? "Connecting..." : "Connect to Xero"}
              </Button>
            )}
            <div className={`mt-4 text-center ${resultContent.toLowerCase().includes('error') ? "text-red-600" : "text-green-600"}`}>
              {resultContent}
            </div>

            <div className="pt-4 border-t text-sm text-muted-foreground">
              <p>
                By connecting your Xero account, you agree to share your accounting
                data according to our privacy policy and terms of service.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
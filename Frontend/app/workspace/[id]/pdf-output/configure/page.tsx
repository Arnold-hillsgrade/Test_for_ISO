"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/ui/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import axios from "@/app/utils/axiosConfig";

interface PDFConfig {
  basicPDF: {
    enabled: boolean;
    templates: Record<string, string>;
  };
  adobeSign: {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
  };
  docuSign: {
    enabled: boolean;
    integrationKey: string;
    accountId: string;
  };
  pandaDoc: {
    enabled: boolean;
    apiKey: string;
    workspaceId: string;
  };
}

const DOCUMENT_TYPES = [
  "Quote",
  "Purchase Order",
  "Invoice",
  "Employee Agreement",
  "Contractor Agreement",
];

export default function ConfigurePDFPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split('/')[2];
  const [config, setConfig] = useState<PDFConfig>({
    basicPDF: { enabled: false, templates: {} },
    adobeSign: { enabled: false, clientId: '', clientSecret: '' },
    docuSign: { enabled: false, integrationKey: '', accountId: '' },
    pandaDoc: { enabled: false, apiKey: '', workspaceId: '' }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchConfig = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pdf/config`,
          {
            params: { workspaceId: id },
            signal: abortController.signal
          }
        );

        if (!abortController.signal.aborted && response.status === 200) {
          setConfig(response.data);
        }
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error("Error fetching PDF configuration:", error);
        }
      }
    };

    fetchConfig();

    return () => {
      abortController.abort();
    };
  }, [id]);

  const handleSave = async () => {
    const abortController = new AbortController();
    
    try {
      setLoading(true);
      await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pdf/config`,
        { ...config, workspaceId: id },
        {
          signal: abortController.signal
        }
      );

      if (!abortController.signal.aborted) {
        router.push(`/workspace/${id}/pdf-output`);
      }
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error("Error saving PDF configuration:", error);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }

    return () => {
      abortController.abort();
    };
  };

  const handleConfigChange = (section: keyof PDFConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
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
          Back to PDF Output
        </Button>

        <div className="space-y-6 max-w-4xl mx-auto">
          <Card className="p-6">
            <h1 className="text-2xl font-bold mb-6">Configure PDF Output</h1>

            <Tabs defaultValue="basic" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic PDF</TabsTrigger>
                <TabsTrigger value="adobe">Adobe Sign</TabsTrigger>
                <TabsTrigger value="docusign">DocuSign</TabsTrigger>
                <TabsTrigger value="pandadoc">PandaDoc</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Basic PDF Output</Label>
                      <p className="text-sm text-muted-foreground">
                        Generate PDFs without digital signatures
                      </p>
                    </div>
                    <Switch
                      checked={config.basicPDF.enabled}
                      onCheckedChange={(checked) => handleConfigChange('basicPDF', 'enabled', checked)}
                    />
                  </div>
                  
                  {DOCUMENT_TYPES.map((docType) => (
                    <div key={docType} className="space-y-2">
                      <Label>{docType} Template</Label>
                      <Select
                        value={config.basicPDF.templates[docType] || ""}
                        onValueChange={(value) => handleConfigChange('basicPDF', 'templates', { ...config.basicPDF.templates, [docType]: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${docType} template`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="template1">Template 1</SelectItem>
                          <SelectItem value="template2">Template 2</SelectItem>
                          <SelectItem value="template3">Template 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="adobe" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Adobe Sign Integration</Label>
                      <p className="text-sm text-muted-foreground">
                        Use Adobe Sign for digital signatures
                      </p>
                    </div>
                    <Switch
                      checked={config.adobeSign.enabled}
                      onCheckedChange={(checked) => handleConfigChange('adobeSign', 'enabled', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Client ID</Label>
                    <Input
                      type="password"
                      placeholder="Enter your Adobe Sign Client ID"
                      value={config.adobeSign.clientId}
                      onChange={(e) => handleConfigChange('adobeSign', 'clientId', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Client Secret</Label>
                    <Input
                      type="password"
                      placeholder="Enter your Adobe Sign Client Secret"
                      value={config.adobeSign.clientSecret}
                      onChange={(e) => handleConfigChange('adobeSign', 'clientSecret', e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="docusign" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable DocuSign Integration</Label>
                      <p className="text-sm text-muted-foreground">
                        Use DocuSign for digital signatures
                      </p>
                    </div>
                    <Switch
                      checked={config.docuSign.enabled}
                      onCheckedChange={(checked) => handleConfigChange('docuSign', 'enabled', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Integration Key</Label>
                    <Input
                      type="password"
                      placeholder="Enter your DocuSign Integration Key"
                      value={config.docuSign.integrationKey}
                      onChange={(e) => handleConfigChange('docuSign', 'integrationKey', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Account ID</Label>
                    <Input
                      placeholder="Enter your DocuSign Account ID"
                      value={config.docuSign.accountId}
                      onChange={(e) => handleConfigChange('docuSign', 'accountId', e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pandadoc" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable PandaDoc Integration</Label>
                      <p className="text-sm text-muted-foreground">
                        Use PandaDoc for digital signatures
                      </p>
                    </div>
                    <Switch
                      checked={config.pandaDoc.enabled}
                      onCheckedChange={(checked) => handleConfigChange('pandaDoc', 'enabled', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      placeholder="Enter your PandaDoc API Key"
                      value={config.pandaDoc.apiKey}
                      onChange={(e) => handleConfigChange('pandaDoc', 'apiKey', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Workspace ID</Label>
                    <Input
                      placeholder="Enter your PandaDoc Workspace ID"
                      value={config.pandaDoc.workspaceId}
                      onChange={(e) => handleConfigChange('pandaDoc', 'workspaceId', e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex justify-end">
              <Button 
                size="lg" 
                onClick={handleSave} 
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
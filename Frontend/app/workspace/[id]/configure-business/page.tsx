"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload, AlertCircle, Loader2, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/ui/header";
import axios from "@/app/utils/axiosConfig";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface NumberSequence {
  prefix: string;
  nextNumber: number;
}

export default function ConfigureBusinessPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split("/")[2];
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [squareLogoFile, setSquareLogoFile] = useState<File | null>(null);
  const [wideLogoFile, setWideLogoFile] = useState<File | null>(null);
  const [defaultLogoPreview, setDefaultLogoPreview] = useState<string | null>(null);
  const [squareLogoPreview, setSquareLogoPreview] = useState<string | null>(null);
  const [wideLogoPreview, setWideLogoPreview] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  // Document number sequences
  const [invoiceSequence, setInvoiceSequence] = useState<NumberSequence>({ prefix: "INV-", nextNumber: 1000 });
  const [purchaseOrderSequence, setPurchaseOrderSequence] = useState<NumberSequence>({ prefix: "PO-", nextNumber: 1000 });
  const [quoteSequence, setQuoteSequence] = useState<NumberSequence>({ prefix: "QT-", nextNumber: 1000 });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string>('');
  const [defaultLogoRemoved, setDefaultLogoRemoved] = useState(false);
  const [squareLogoRemoved, setSquareLogoRemoved] = useState(false);
  const [wideLogoRemoved, setWideLogoRemoved] = useState(false);

  // Alert dialog state
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: 'invoice' | 'purchaseOrder' | 'quote';
    newValue: number;
  }>({
    isOpen: false,
    title: '',
    description: '',
    type: 'invoice',
    newValue: 0
  });

  const countryStates: { [key: string]: string[] } = {
    "Afghanistan": [],
    "Albania": [],
    "Algeria": [],
    "Andorra": [],
    "Angola": [],
    "Antigua and Barbuda": [],
    "Argentina": [],
    "Armenia": [],
    "Australia": ["New South Wales", "Victoria", "Queensland", "Western Australia", "South Australia", "Tasmania", "Northern Territory", "Australian Capital Territory"],
    "Austria": [],
    "Azerbaijan": [],
    "Bahamas": [],
    "Bahrain": [],
    "Bangladesh": [],
    "Barbados": [],
    "Belarus": [],
    "Belgium": [],
    "Belize": [],
    "Benin": [],
    "Bhutan": [],
    "Bolivia": [],
    "Bosnia and Herzegovina": [],
    "Botswana": [],
    "Brazil": [],
    "Brunei": [],
    "Bulgaria": [],
    "Burkina Faso": [],
    "Burundi": [],
    "Cabo Verde": [],
    "Cambodia": [],
    "Cameroon": [],
    "Canada": ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Nova Scotia", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Northwest Territories", "Nunavut", "Yukon"],
    "Central African Republic": [],
    "Chad": [],
    "Chile": [],
    "China": [],
    "Colombia": [],
    "Comoros": [],
    "Congo, Democratic Republic of the": [],
    "Congo, Republic of the": [],
    "Costa Rica": [],
    "Croatia": [],
    "Cuba": [],
    "Cyprus": [],
    "Czech Republic": [],
    "Denmark": [],
    "Djibouti": [],
    "Dominica": [],
    "Dominican Republic": [],
    "Ecuador": [],
    "Egypt": [],
    "El Salvador": [],
    "Equatorial Guinea": [],
    "Eritrea": [],
    "Estonia": [],
    "Eswatini": [],
    "Ethiopia": [],
    "Fiji": [],
    "Finland": [],
    "France": [],
    "Gabon": [],
    "Gambia": [],
    "Georgia": [],
    "Germany": [],
    "Ghana": [],
    "Greece": [],
    "Grenada": [],
    "Guatemala": [],
    "Guinea": [],
    "Guinea-Bissau": [],
    "Guyana": [],
    "Haiti": [],
    "Honduras": [],
    "Hungary": [],
    "Iceland": [],
    "India": ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep", "Delhi", "Puducherry", "Ladakh", "Jammu and Kashmir"],
    "Indonesia": [],
    "Iran": [],
    "Iraq": [],
    "Ireland": [],
    "Israel": [],
    "Italy": [],
    "Jamaica": [],
    "Japan": [],
    "Jordan": [],
    "Kazakhstan": [],
    "Kenya": [],
    "Kiribati": [],
    "Korea, North": [],
    "Korea, South": [],
    "Kosovo": [],
    "Kuwait": [],
    "Kyrgyzstan": [],
    "Laos": [],
    "Latvia": [],
    "Lebanon": [],
    "Lesotho": [],
    "Liberia": [],
    "Libya": [],
    "Liechtenstein": [],
    "Lithuania": [],
    "Luxembourg": [],
    "Madagascar": [],
    "Malawi": [],
    "Malaysia": [],
    "Maldives": [],
    "Mali": [],
    "Malta": [],
    "Marshall Islands": [],
    "Mauritania": [],
    "Mauritius": [],
    "Mexico": [],
    "Micronesia": [],
    "Moldova": [],
    "Monaco": [],
    "Mongolia": [],
    "Montenegro": [],
    "Morocco": [],
    "Mozambique": [],
    "Myanmar": [],
    "Namibia": [],
    "Nauru": [],
    "Nepal": [],
    "Netherlands": [],
    "New Zealand": [],
    "Nicaragua": [],
    "Niger": [],
    "Nigeria": [],
    "North Macedonia": [],
    "Norway": [],
    "Oman": [],
    "Pakistan": ["Balochistan", "Khyber Pakhtunkhwa", "Punjab", "Sindh", "Islamabad Capital Territory", "Gilgit-Baltistan", "Azad Jammu and Kashmir"],
    "Palau": [],
    "Palestine": [],
    "Panama": [],
    "Papua New Guinea": [],
    "Paraguay": [],
    "Peru": [],
    "Philippines": [],
    "Poland": [],
    "Portugal": [],
    "Qatar": [],
    "Romania": [],
    "Russia": [],
    "Rwanda": [],
    "Saint Kitts and Nevis": [],
    "Saint Lucia": [],
    "Saint Vincent and the Grenadines": [],
    "Samoa": [],
    "San Marino": [],
    "Sao Tome and Principe": [],
    "Saudi Arabia": [],
    "Senegal": [],
    "Serbia": [],
    "Seychelles": [],
    "Sierra Leone": [],
    "Singapore": [],
    "Slovakia": [],
    "Slovenia": [],
    "Solomon Islands": [],
    "Somalia": [],
    "South Africa": [],
    "South Sudan": [],
    "Spain": [],
    "Sri Lanka": [],
    "Sudan": [],
    "Suriname": [],
    "Sweden": [],
    "Switzerland": [],
    "Syria": [],
    "Taiwan": [],
    "Tajikistan": [],
    "Tanzania": [],
    "Thailand": [],
    "Timor-Leste": [],
    "Togo": [],
    "Tonga": [],
    "Trinidad and Tobago": [],
    "Tunisia": [],
    "Turkey": [],
    "Turkmenistan": [],
    "Tuvalu": [],
    "Uganda": [],
    "Ukraine": [],
    "United Arab Emirates": ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah and Fujairah"],
    "United Kingdom": ["England", "Scotland", "Wales", "Northern Ireland"],
    "United States": ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"],
    "Uruguay": [],
    "Uzbekistan": [],
    "Vanuatu": [],
    "Vatican City": [],
    "Venezuela": [],
    "Vietnam": [],
    "Yemen": [],
    "Zambia": [],
    "Zimbabwe": []
  };

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    street: "",
    country: "",
    suburb: "",
    state: "",
    postcode: "",
    abn: "",
    acn: "",
    workspaceId: id,
    bankAccountName: "",
    bankName: "",
    bsb: "",
    accountNumber: "",
    paymentReference: "",
    accountsReceivableTerms: "",
    accountsPayableTerms: "",
  });

  useEffect(() => {
    const abortController = new AbortController();

    const fetchBusinessProfile = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/business/profile`,
          {
            params: { workspaceId: id },
            signal: abortController.signal,
          }
        );

        if (!abortController.signal.aborted) {
          const data = response.data;
          setFormData({
            name: data.name || "",
            phone: data.phone || "",
            email: data.email || "",
            street: data.address?.street || "",
            country: data.address?.country || "",
            suburb: data.address?.suburb || "",
            state: data.address?.state || "",
            postcode: data.address?.postcode || "",
            abn: data.abn || "",
            acn: data.acn || "",
            workspaceId: id,
            bankAccountName: data.bankDetails?.accountName || "",
            bankName: data.bankDetails?.bankName || "",
            bsb: data.bankDetails?.bsb || "",
            accountNumber: data.bankDetails?.accountNumber || "",
            paymentReference: data.bankDetails?.paymentReference || "",
            accountsReceivableTerms: data.bankDetails?.accountsReceivableTerms || "",
            accountsPayableTerms: data.bankDetails?.accountsPayableTerms || "",
          });

          // Set document numbering sequences
          if (data.documentNumbering) {
            if (data.documentNumbering.invoice) {
              setInvoiceSequence(data.documentNumbering.invoice);
            }
            if (data.documentNumbering.purchaseOrder) {
              setPurchaseOrderSequence(data.documentNumbering.purchaseOrder);
            }
            if (data.documentNumbering.quote) {
              setQuoteSequence(data.documentNumbering.quote);
            }
          }

          // Set logo previews
          if (data.defaultLogo) {
            setDefaultLogoPreview(data.defaultLogo);
          } else {
            setDefaultLogoPreview(null);
          }
          if (data.squareLogo) {
            setSquareLogoPreview(data.squareLogo);
          } else {
            setSquareLogoPreview(null);
          }
          if (data.wideLogo) {
            setWideLogoPreview(data.wideLogo);
          } else {
            setWideLogoPreview(null);
          }
        }
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error("Failed to fetch business profile:", error);
        }
      }
    };

    fetchBusinessProfile();

    return () => {
      abortController.abort();
    };
  }, [id]);

  const handleLogoChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key as keyof typeof formData]);
      });
      formDataToSend.append('documentNumbering', JSON.stringify({
        invoice: invoiceSequence,
        purchaseOrder: purchaseOrderSequence,
        quote: quoteSequence
      }));

      if (logoFile) {
        formDataToSend.append("defaultLogo", logoFile);
      }
      if (squareLogoFile) {
        formDataToSend.append("squareLogo", squareLogoFile);
      }
      if (wideLogoFile) {
        formDataToSend.append("wideLogo", wideLogoFile);
      }
      if (defaultLogoRemoved) {
        formDataToSend.append("defaultLogoRemoved", "true");
      }
      if (squareLogoRemoved) {
        formDataToSend.append("squareLogoRemoved", "true");
      }
      if (wideLogoRemoved) {
        formDataToSend.append("wideLogoRemoved", "true");
      }

      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/business/profile`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          }
        }
      );

      if (response.data.status === 200) {
        setShowError(false);
        setShowSuccess(true);
        setLogoFile(null);
        setSquareLogoFile(null);
        setWideLogoFile(null);
        setDefaultLogoRemoved(false);
        setSquareLogoRemoved(false);
        setWideLogoRemoved(false);
        setTimeout(() => setShowSuccess(false), 2000);
      }

    } catch (error: any) {
      setShowSuccess(false);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        setApiError(error.response.data.message);
      } else {
        setApiError('An unexpected error occurred');
      }
      setTimeout(() => {
        setErrors([]);
        setApiError('');
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleNumberChange = (type: 'invoice' | 'purchaseOrder' | 'quote', value: string) => {
    const newValue = parseInt(value);
    const currentValue = type === 'invoice'
      ? invoiceSequence.nextNumber
      : type === 'purchaseOrder'
        ? purchaseOrderSequence.nextNumber
        : quoteSequence.nextNumber;

    if (newValue < currentValue) {
      setAlertDialog({
        isOpen: true,
        title: 'Warning: Reducing Number Sequence',
        description: 'Reducing the next number may result in duplicate document numbers if previous numbers have been used. Are you sure you want to continue?',
        type,
        newValue
      });
    } else {
      updateNumberSequence(type, newValue);
    }
  };

  const updateNumberSequence = (type: 'invoice' | 'purchaseOrder' | 'quote', value: number) => {
    switch (type) {
      case 'invoice':
        setInvoiceSequence(prev => ({ ...prev, nextNumber: value }));
        break;
      case 'purchaseOrder':
        setPurchaseOrderSequence(prev => ({ ...prev, nextNumber: value }));
        break;
      case 'quote':
        setQuoteSequence(prev => ({ ...prev, nextNumber: value }));
        break;
    }
  };

  const handleRemoveLogo = (type: 'default' | 'square' | 'wide') => {
    switch (type) {
      case 'default':
        setDefaultLogoPreview(null);
        setDefaultLogoRemoved(true);
        setLogoFile(null);
        break;
      case 'square':
        setSquareLogoPreview(null);
        setSquareLogoRemoved(true);
        setSquareLogoFile(null);
        break;
      case 'wide':
        setWideLogoPreview(null);
        setWideLogoRemoved(true);
        setWideLogoFile(null);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8">
        <Button variant="ghost" className="mb-6" onClick={() => router.replace(`/workspace/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workspace
        </Button>

        <Card className="max-w-2xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-6">Configure Your Business</h1>

          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="additional">Additional Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <div className="space-y-6">
                <div className="space-y-4 border rounded-lg p-5">
                  <h3 className="text-lg font-semibold">Company Logos</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload different logo formats for various uses throughout the application
                  </p>

                  <div className="border rounded-lg p-4">
                    <Tabs defaultValue="default" className="space-y-4">
                      <TabsList className="grid grid-cols-3 w-full">
                        <TabsTrigger value="default">Default Logo</TabsTrigger>
                        <TabsTrigger value="square">Square Logo</TabsTrigger>
                        <TabsTrigger value="wide">Wide Logo</TabsTrigger>
                      </TabsList>

                      <TabsContent value="default" className="pt-4">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted relative"
                          >
                            {defaultLogoPreview ? (
                              <>
                                <img
                                  src={defaultLogoPreview}
                                  alt="Default Logo Preview"
                                  className="w-full h-full object-contain"
                                />
                                <button
                                  type="button"
                                  className="absolute top-[0px] right-[0px] bg-white rounded-full p-1 shadow hover:bg-red-100 z-10"
                                  onClick={() => handleRemoveLogo('default')}
                                  aria-label="Remove Default Logo"
                                >
                                  <X className="w-4 h-4 text-destructive" />
                                </button>
                              </>
                            ) : (
                              <Upload className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-2">Default Logo</h4>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleLogoChange(e, setDefaultLogoPreview, setLogoFile)}
                              className="max-w-xs"
                            />
                            <p className="text-sm text-muted-foreground mt-2">
                              Maximum file size: 5MB
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Used for general application areas, profile displays, and generated PDF documents
                            </p>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="square" className="pt-4">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted relative"
                          >
                            {squareLogoPreview ? (
                              <>
                                <img
                                  src={squareLogoPreview}
                                  alt="Square Logo Preview"
                                  className="w-full h-full object-contain"
                                />
                                <button
                                  type="button"
                                  className="absolute top-[0px] right-[0px] bg-white rounded-full p-1 shadow hover:bg-red-100 z-10"
                                  onClick={() => handleRemoveLogo('square')}
                                  aria-label="Remove Square Logo"
                                >
                                  <X className="w-4 h-4 text-destructive" />
                                </button>
                              </>
                            ) : (
                              <Upload className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-2">Square Logo</h4>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleLogoChange(e, setSquareLogoPreview, setSquareLogoFile)}
                              className="max-w-xs"
                            />
                            <p className="text-sm text-muted-foreground mt-2">
                              Recommended size: 512x512px
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Used for online forms
                            </p>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="wide" className="pt-4">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-48 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted relative"
                          >
                            {wideLogoPreview ? (
                              <>
                                <img
                                  src={wideLogoPreview}
                                  alt="Wide Logo Preview"
                                  className="w-full h-full object-contain"
                                />
                                <button
                                  type="button"
                                  className="absolute top-[0px] right-[0px] bg-white rounded-full p-1 shadow hover:bg-red-100 z-10"
                                  onClick={() => handleRemoveLogo('wide')}
                                  aria-label="Remove Wide Logo"
                                >
                                  <X className="w-4 h-4 text-destructive" />
                                </button>
                              </>
                            ) : (
                              <Upload className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-2">Wide Logo</h4>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleLogoChange(e, setWideLogoPreview, setWideLogoFile)}
                              className="max-w-xs"
                            />
                            <p className="text-sm text-muted-foreground mt-2">
                              Recommended size: 820 x 312 pixels, with your logo centred within the middle third of the document area
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Used for online documents
                            </p>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>

                <div className="space-y-4 border rounded-lg p-5">
                  <h3 className="text-lg font-semibold">Business Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Company Name</Label>
                      <Input
                        id="name"
                        placeholder="Enter company name"
                        value={formData.name}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="Enter phone number"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Business Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter business email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-4  border rounded-lg p-5">
                  <h3 className="text-lg font-semibold">Business Address</h3>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select
                      value={formData.country}
                      onValueChange={(value) =>
                        setFormData((prevData) => ({
                          ...prevData,
                          country: value,
                        }))
                      }
                    >
                      <SelectTrigger id="country">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(countryStates).map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      placeholder="Enter street address"
                      value={formData.street}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="suburb">Suburb</Label>
                      <Input
                        id="suburb"
                        placeholder="Enter city"
                        value={formData.suburb}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Select
                        value={formData.state}
                        onValueChange={(value) =>
                          setFormData((prevData) => ({
                            ...prevData,
                            state: value,
                          }))
                        }
                      >
                        <SelectTrigger id="state">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {countryStates[formData.country]?.map((state: string) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postcode">Postcode</Label>
                    <Input
                      id="postcode"
                      placeholder="Enter postcode"
                      maxLength={8}
                      value={formData.postcode}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-4  border rounded-lg p-5">
                  <h3 className="text-lg font-semibold">Business Numbers</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="abn">Australian Business Number (ABN)</Label>
                      <Input
                        id="abn"
                        placeholder="Enter ABN"
                        maxLength={11}
                        value={formData.abn}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="acn">Australian Company Number (ACN)</Label>
                      <Input
                        id="acn"
                        placeholder="Enter ACN"
                        maxLength={9}
                        value={formData.acn}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="additional">
              <div className="space-y-6">
                {/* Bank Details */}
                <div className="space-y-4 border rounded-lg p-5">
                  <h3 className="text-lg font-semibold">Bank Details</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    These details will appear on your invoices for receiving payments
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        placeholder="Enter bank name"
                        value={formData.bankName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankAccountName">Account Name</Label>
                      <Input
                        id="bankAccountName"
                        value={formData.bankAccountName}
                        onChange={handleInputChange}
                        placeholder="Enter account name"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bsb">BSB</Label>
                        <Input
                          id="bsb"
                          placeholder="Enter BSB"
                          value={formData.bsb}
                          onChange={handleInputChange}
                          maxLength={6}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input
                          id="accountNumber"
                          placeholder="Enter account number"
                          value={formData.accountNumber}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountsReceivableTerms">Accounts Receivable Payment Terms</Label>
                      <Input
                        id="accountsReceivableTerms"
                        placeholder="When clients are expected to pay you"
                        value={formData.accountsReceivableTerms}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountsPayableTerms">Accounts Payable Payment Terms</Label>
                      <Input
                        id="accountsPayableTerms"
                        placeholder="When your business pays contractors or suppliers"
                        value={formData.accountsPayableTerms}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4 border rounded-lg p-5">
                  <h3 className="text-lg font-semibold">Document Number Configuration</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure prefixes and next numbers for various document types
                  </p>

                  {/* Invoice Numbers */}
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                      <h4 className="font-medium">Invoice Numbers</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="invoice-prefix">Prefix</Label>
                          <Input
                            id="invoice-prefix"
                            value={invoiceSequence.prefix}
                            onChange={(e) => setInvoiceSequence(prev => ({ ...prev, prefix: e.target.value }))}
                            placeholder="e.g. INV-"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invoice-next">Next Number</Label>
                          <Input
                            id="invoice-next"
                            type="number"
                            value={invoiceSequence.nextNumber}
                            onChange={(e) => handleNumberChange('invoice', e.target.value)}
                            min={1}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Next invoice will be: {invoiceSequence.prefix}{invoiceSequence.nextNumber}
                      </p>
                    </div>

                    {/* Purchase Order Numbers */}
                    <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                      <h4 className="font-medium">Purchase Order Numbers</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="po-prefix">Prefix</Label>
                          <Input
                            id="po-prefix"
                            value={purchaseOrderSequence.prefix}
                            onChange={(e) => setPurchaseOrderSequence(prev => ({ ...prev, prefix: e.target.value }))}
                            placeholder="e.g. PO-"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="po-next">Next Number</Label>
                          <Input
                            id="po-next"
                            type="number"
                            value={purchaseOrderSequence.nextNumber}
                            onChange={(e) => handleNumberChange('purchaseOrder', e.target.value)}
                            min={1}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Next purchase order will be: {purchaseOrderSequence.prefix}{purchaseOrderSequence.nextNumber}
                      </p>
                    </div>

                    {/* Quote Numbers */}
                    <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                      <h4 className="font-medium">Quote Numbers</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="quote-prefix">Prefix</Label>
                          <Input
                            id="quote-prefix"
                            value={quoteSequence.prefix}
                            onChange={(e) => setQuoteSequence(prev => ({ ...prev, prefix: e.target.value }))}
                            placeholder="e.g. QT-"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quote-next">Next Number</Label>
                          <Input
                            id="quote-next"
                            type="number"
                            value={quoteSequence.nextNumber}
                            onChange={(e) => handleNumberChange('quote', e.target.value)}
                            min={1}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Next quote will be: {quoteSequence.prefix}{quoteSequence.nextNumber}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            {errors.length > 0 && (
              <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-md">
                <h4 className="text-sm font-medium text-destructive mb-2">Please correct the following errors:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-sm text-destructive">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {apiError && (
              <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-md">
                <p className="text-sm text-destructive">{apiError}</p>
              </div>
            )}

            {showSuccess && (
              <div className="mb-4 p-4 bg-green-100 border border-green-500 rounded-md">
                <p className="text-sm text-green-700">Business profile saved successfully!</p>
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save Business Configuration'
              )}
            </Button>
          </div>
        </Card>
      </div >

      {/* Warning Dialog for Number Sequence Reduction */}
      <AlertDialog
        open={alertDialog.isOpen}
        onOpenChange={(open) => setAlertDialog(prev => ({ ...prev, isOpen: open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {alertDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {alertDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                updateNumberSequence(alertDialog.type, alertDialog.newValue);
                setAlertDialog(prev => ({ ...prev, isOpen: false }));
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
}

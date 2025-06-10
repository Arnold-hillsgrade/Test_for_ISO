"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Settings, Wand2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Header } from "@/components/ui/header";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useAppContext } from "@/app/context";
import axios from "@/app/utils/axiosConfig";

// Define the attribute type as a literal union type
type AttributeType = "Text" | "Long Text";

interface ISOAttribute {
  id: string;
  name: string;
  type: AttributeType;
}

type BoardLabel = 'Job Management' | 'Care Management' | 'No Label';

const BOARD_LABELS: NonNullable<BoardLabel>[] = [
  'Job Management',
  'Care Management',
  'No Label'
];

const LABEL_COLORS: Record<NonNullable<BoardLabel>, string> = {
  'Job Management': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  'Care Management': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
  'No Label': 'bg-teal-100 text-teal-800 dark:bg-lightgray-900 dark:text-lightgray-300'
};

interface SuggestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  suggestion: string | null;
  reason: string;
}

interface Board {
  id: string;
  name: string;
  label: string;
  attributeId: string;
}

function SuggestionDialog({ isOpen, onClose, onConfirm, suggestion, reason }: SuggestionDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Label Suggestion</AlertDialogTitle>
          <AlertDialogDescription>
            {reason}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>No, keep current</AlertDialogCancel>
          {suggestion && (
            <AlertDialogAction onClick={onConfirm}>Yes, update label</AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function ConfigurationPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split("/")[2];
  const boardId = pathname.split("/")[4];
  const { workspaces } = useAppContext();
  const [board, setBoard] = useState<Board>();
  const [selectedAttribute, setSelectedAttribute] = useState<string>("");
  const [boardLabel, setBoardLabel] = useState<BoardLabel>('No Label');
  const [isoAttributes, setIsoAttributes] = useState<ISOAttribute[]>([]);
  const [suggestionDialog, setSuggestionDialog] = useState<{
    isOpen: boolean;
    suggestion: BoardLabel;
    reason: string;
  }>({
    isOpen: false,
    suggestion: 'No Label',
    reason: ''
  });

  useEffect(() => {
    const abortController = new AbortController();

    const fetchAttributes = async () => {
      if (!board) {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/boards/attribute?workspaceId=${id}&boardId=${boardId}`,
            {
              signal: abortController.signal
            }
          );

          const attributes = response.data.attributes;
          const formattedAttributes = attributes.map((attr: any) => {
            return {
              id: attr.id, name: attr.name, type: attr.type == "text" ? "Text" : "Long Text"
            }
          });
          console.log("Formatted Attributes:", formattedAttributes);
          setIsoAttributes([...formattedAttributes]);
        } catch (error) {
          if (!axios.isCancel(error)) {
            console.error("Error fetching attributes:", error);
          }
        }
      }
    };

    fetchAttributes();

    return () => {
      abortController.abort();
    };
  }, [boardId]);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchBoards = async () => {
      if (!board) {
        try {
          const boardResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/boards?id=${boardId}`,
            {
              signal: abortController.signal
            }
          );
          const boardData = { id: boardId, name: boardResponse.data.board.name, label: boardResponse.data.board.label || 'No Label', attributeId: boardResponse.data.board.attribute.id || '' };
          setBoard(boardData);
          setSelectedAttribute(boardResponse.data.board.attribute.id || '');
          setBoardLabel(boardResponse.data.board.label || 'No Label');
        } catch (error) {
          if (!axios.isCancel(error)) {
            console.error("Error fetching board:", error);
          }
          setBoard({ id: boardId, name: '', label: 'No Label', attributeId: '' });
          setSelectedAttribute('');
          return;
        }
      }
    };

    fetchBoards();

    return () => {
      abortController.abort();
    };
  }, [id, boardId]);

  const workspace = workspaces.find(workspace => workspace.id.toString() === id);

  if (!workspace || !board) {
    return null;
  }

  const suggestLabel = () => {
    const name = board.name.toLowerCase();
    let suggestion: BoardLabel = 'No Label';
    let reason = '';

    if (name.includes('job management')) {
      suggestion = 'Job Management';
      reason = "Based on the board name containing 'Job Management', we suggest labeling this as a Job Management board.";
    } else if (name.includes('care management')) {
      suggestion = 'Care Management';
      reason = "Based on the board name containing 'Care Management', we suggest labeling this as a Care Management board.";
    } else {
      reason = "We couldn't automatically determine the board type based on its name. Please select a label manually if needed.";
    }

    setSuggestionDialog({
      isOpen: true,
      suggestion,
      reason
    });
  };

  const handleSuggestionConfirm = () => {
    setBoardLabel(suggestionDialog.suggestion);
    setSuggestionDialog(prev => ({ ...prev, isOpen: false }));
  };

  const handleSaveConfiguration = async () => {
    const attr = isoAttributes.find(item => item.id == selectedAttribute);
    console.log(attr?.name)
    await axios.put(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/boards`,
      { ...board, label: boardLabel, attribute: { id: selectedAttribute, name: attr?.name }, boardId, workspaceId: id },
      {}
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.push(`/workspace/${id}/board/${boardId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Board
        </Button>

        <div className="space-y-6 max-w-3xl mx-auto">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Board Configuration</h1>
                <p className="text-muted-foreground">
                  Configure board settings and integrations
                </p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Board Label Configuration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Board Label</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={suggestLabel}
                    className="gap-2"
                  >
                    <Wand2 className="h-4 w-4" />
                    Suggest Label
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Labels determine which integration features are available for this board.
                  'Job Management' and 'Care Management' boards have access to specific automation features.
                </p>
                <div className="space-y-2">
                  <Select
                    value={boardLabel || "No Label"}
                    onValueChange={(value) => setBoardLabel(value as BoardLabel)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue>
                        {boardLabel ? (
                          <Badge variant="outline" className={LABEL_COLORS[boardLabel]}>
                            {boardLabel}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className={LABEL_COLORS['No Label']}>
                            No Label
                          </Badge>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {BOARD_LABELS.map((label) => (
                        <SelectItem key={label} value={label}>
                          <Badge variant="outline" className={LABEL_COLORS[label]}>
                            {label}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {boardLabel && (
                    <p className="text-sm text-muted-foreground">
                      This board will use {boardLabel.toLowerCase()} specific features and automations.
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t" />

              {/* ISO+ Attribute Configuration */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Integration Message Configuration</h2>
                <p className="text-sm text-muted-foreground">
                  Select which ISO+ attribute should be used for integration status updates, progress messages,
                  and user notifications during automated processes.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="attribute">ISO+ Attribute for Messages</Label>
                  <Select value={selectedAttribute} onValueChange={setSelectedAttribute}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an attribute" />
                    </SelectTrigger>
                    <SelectContent>
                      {isoAttributes.map((attr) => (
                        <SelectItem key={attr.id} value={attr.id} defaultValue={selectedAttribute}>
                          <div className="flex items-center justify-between w-full">
                            <span>{attr.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {attr.type}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-6">
                <Button
                  onClick={handleSaveConfiguration}
                  className="w-full"
                  size="lg"
                >
                  Save Configuration
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <SuggestionDialog
        isOpen={suggestionDialog.isOpen}
        onClose={() => setSuggestionDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleSuggestionConfirm}
        suggestion={suggestionDialog.suggestion}
        reason={suggestionDialog.reason}
      />
    </div>
  );
}
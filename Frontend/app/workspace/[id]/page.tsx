"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Building2, FileSpreadsheet, FileText, BarChart, Info, History } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { Header } from "@/components/ui/header";
import { useAppContext } from "@/app/context";
import axios from "@/app/utils/axiosConfig";
import Spinner from "@/components/ui/spin";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Board {
  id: string;
  name: string;
  label: string
}

type BoardLabel = 'Job Management' | 'Care Management' | 'No Label';

const LABEL_COLORS: Record<NonNullable<BoardLabel>, string> = {
  'Job Management': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  'Care Management': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
  'No Label': 'bg-teal-100 text-teal-800 dark:bg-lightgray-900 dark:text-lightgray-300',
};

export default function WorkspaceDetail() {
  const router = useRouter();
  const pathname = usePathname();
  const { workspaces, user } = useAppContext();
  const id = pathname.split('/').pop();
  const workspace = workspaces.find(workspace => workspace.id.toString() === id);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loadingBoards, setLoadingBoards] = useState<boolean>(false); // Loading state for boards

  useEffect(() => {
    const abortController = new AbortController();

    const fetchBoards = async () => {
      if (boards.length === 0) {
        setLoadingBoards(true);
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/workspaces/boards?workspaceId=${id}`,
            {
              signal: abortController.signal
            }
          );

          const data: Board[] = await Promise.all(
            response.data.board.map(async (board: any) => {
              try {
                const boardResponse = await axios.get(
                  `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/boards?id=${board.id}`,
                  {
                    signal: abortController.signal
                  }
                );
                return { ...board, label: boardResponse.data.board.label };
              } catch (error) {
                if (!axios.isCancel(error)) {
                  console.error("Error fetching board:", error);
                }
                return { ...board, label: null };
              }
            })
          );

          if (!abortController.signal.aborted) {
            setBoards(data);
          }
        } catch (error) {
          if (!axios.isCancel(error)) {
            console.error("Error fetching boards:", error);
          }
        } finally {
          if (!abortController.signal.aborted) {
            setLoadingBoards(false);
          }
        }
      }
    };

    if (workspace === undefined) {
      return;
    }

    const isOwnerOrSupport = user.role === "owner" || user.role === "support_admin";
    const isIsoPlusUserWithAdminOrOwner = user.role === "isoplus_user" && (workspace && (workspace.user_role === "admin" || workspace.user_role === "owner"));

    if (!isOwnerOrSupport && !isIsoPlusUserWithAdminOrOwner) {
      router.replace("/workspace/access-denied");
      return;
    }

    fetchBoards();

    return () => {
      abortController.abort();
    };
  }, [id, boards.length]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8">
        <Button
          variant="ghost"
          className="mb-6 hover:bg-secondary"
          onClick={() => router.push("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="space-y-6">
          {/* Workspace Info */}
          <Card className="p-6 shadow-lg card-hover">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
                  {workspace?.name}
                </h1>
                <p className="text-muted-foreground font-mono text-sm">ID: {workspace?.id}</p>
              </div>
              <Button
                onClick={() => router.push(`/workspace/${workspace?.id}/usage-report`)}
                variant="outline"
                className="gap-2 button-hover"
              >
                <BarChart className="h-4 w-4" />
                View Usage Report
              </Button>
            </div>
          </Card>

          {/* Workspace Actions */}
          {
            (user.role == "support_admin" || user.role == "owner" || workspace?.user_role == "owner" || workspace?.user_role == "admin") && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 space-y-4 card-hover">
                  <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Business Configuration</h2>
                    <p className="text-muted-foreground mb-4 text-sm">
                      Manage your business details, address, and tax information
                    </p>
                    <Button
                      onClick={() => router.push(`/workspace/${workspace?.id}/configure-business`)}
                      className="w-full button-hover"
                    >
                      Configure Business
                    </Button>
                  </div>
                </Card>

                <Card className="p-6 space-y-4 card-hover">
                  <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                    <FileSpreadsheet className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Xero Integration</h2>
                    <p className="text-muted-foreground mb-4 text-sm">
                      Connect and manage your Xero accounting integration
                    </p>
                    <Button
                      onClick={() => router.push(`/workspace/${workspace?.id}/xero-integration`)}
                      className="w-full button-hover"
                    >
                      Setup Xero
                    </Button>
                  </div>
                </Card>

                {false && (<Card className="p-6 space-y-4 card-hover">
                  <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">PDF Output</h2>
                    <p className="text-muted-foreground mb-4 text-sm">
                      Configure PDF generation and digital signature options
                    </p>
                    <Button
                      onClick={() => router.push(`/workspace/${workspace?.id}/pdf-output`)}
                      className="w-full button-hover"
                    >
                      Setup PDF Output
                    </Button>
                  </div>
                </Card>)}

                <Card className="p-6 space-y-4 card-hover">
                  <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                    <History className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Audit Trail</h2>
                    <p className="text-muted-foreground mb-4 text-sm">
                      Track all activities and changes in your workspace
                    </p>
                    <Button
                      onClick={() => router.push(`/workspace/${workspace?.id}/audit-trail`)}
                      className="w-full button-hover"
                    >
                      View Audit Trail
                    </Button>
                  </div>
                </Card>
              </div>
            )
          }

          {/* Boards List */}
          <Card className="p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-2">Workspace Boards</h2>
            <Table className="enhanced-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Board ID</TableHead>
                  <TableHead className="font-semibold">Board Name</TableHead>
                  <TableHead className={`font-semibold ${user.role == "support_admin" || user.role == "owner" ? '' : 'hidden'}`}>
                    <div className="flex items-center gap-2">
                      Label
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            Label your boards as 'Job Management' or 'Care Management' to enable integration features.
                            Unlabeled boards will operate normally.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableHead>
                  <TableHead className={`font-semibold w-[100px] ${user.role == "support_admin" || user.role == "owner" ? '' : 'hidden'}`}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boards?.map((board) => (
                  <TableRow key={board.id}>
                    <TableCell className="font-mono">{board.id}</TableCell>
                    <TableCell>{board.name}</TableCell>
                    <TableCell className={`font-semibold ${user.role == "support_admin" || user.role == "owner" ? '' : 'hidden'}`}>
                      {board.label ? (
                        <Badge variant="outline" className={board.label ? LABEL_COLORS[board.label as NonNullable<BoardLabel>] : 'No Label'}>
                          {board.label}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className={LABEL_COLORS['No Label']}>
                          No Label
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className={`flex w-[100px] items-center gap-2 ${user.role == "support_admin" || user.role == "owner" ? '' : 'hidden'}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/workspace/${workspace?.id}/board/${board.id}`)}
                        >
                          Open Board
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {loadingBoards ?
              <div className="text-center py-8 text-muted-foreground">
                Loading boards...
                <span className="ml-2"><Spinner /></span>
              </div>
              : boards?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No boards found matching your search.
                </div>
              )}
          </Card>
        </div>
      </div>
    </div >
  );
}
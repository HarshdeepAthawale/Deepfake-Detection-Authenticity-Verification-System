"use client"

import { useState } from "react"
import { Download, FileText, FileJson, FileSpreadsheet, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { apiService, type ScanFilters } from "@/lib/api"
import { cn } from "@/lib/utils"

interface ExportMenuProps {
  scanId?: string
  filters?: ScanFilters
  bulkExport?: boolean
}

export function ExportMenu({ scanId, filters, bulkExport = false }: ExportMenuProps) {
  const [exporting, setExporting] = useState<string | null>(null)

  const handleExport = async (format: "pdf" | "json" | "csv") => {
    try {
      setExporting(format)
      
      let blob: Blob
      let filename: string

      if (bulkExport) {
        // Bulk CSV export
        if (format !== "csv") {
          throw new Error("Bulk export only supports CSV format")
        }
        blob = await apiService.exportScansCSV(filters, 1000)
        filename = `scans_export_${Date.now()}.csv`
      } else if (scanId) {
        // Single scan export
        if (format === "pdf") {
          blob = await apiService.exportScanPDF(scanId)
          filename = `scan_${scanId}_${Date.now()}.pdf`
        } else if (format === "json") {
          blob = await apiService.exportScanJSON(scanId)
          filename = `scan_${scanId}_${Date.now()}.json`
        } else {
          throw new Error("Single scan export does not support CSV format")
        }
      } else {
        throw new Error("Either scanId or bulkExport must be provided")
      }

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setExporting(null)
    } catch (error) {
      console.error("Export error:", error)
      alert(error instanceof Error ? error.message : "Export failed")
      setExporting(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="border-primary/20 bg-transparent text-primary text-[10px] font-bold h-9"
          disabled={!!exporting}
        >
          {exporting ? (
            <>
              <Loader2 size={14} className="mr-2 animate-spin" />
              EXPORTING...
            </>
          ) : (
            <>
              <Download size={14} className="mr-2" />
              EXPORT
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card border-primary/20">
        {!bulkExport && scanId && (
          <>
            <DropdownMenuItem
              onClick={() => handleExport("pdf")}
              disabled={!!exporting}
              className="cursor-pointer font-mono text-[11px]"
            >
              <FileText size={14} className="mr-2" />
              Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleExport("json")}
              disabled={!!exporting}
              className="cursor-pointer font-mono text-[11px]"
            >
              <FileJson size={14} className="mr-2" />
              Export as JSON
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-primary/10" />
          </>
        )}
        <DropdownMenuItem
          onClick={() => handleExport("csv")}
          disabled={!!exporting}
          className="cursor-pointer font-mono text-[11px]"
        >
          <FileSpreadsheet size={14} className="mr-2" />
          {bulkExport ? "Export All as CSV" : "Export as CSV"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

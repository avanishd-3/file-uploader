"use client"

import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "./data-table-pagination"
import { DataTableViewOptions } from "./toggle-column-visibility"
import { useState } from "react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])

  /**
   * See: https://ui.shadcn.com/docs/components/data-table#row-actions
   * No need for column visibility state here as column header component handles it internally
   *  The header component uses the internal state of the table instance to manage column visibility
   *  To add persistence, add visibility externally, see: https://ui.shadcn.com/docs/components/data-table#visibility
   **/
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  })

  return (
    // Gap is for spacing between view options and table
    <div className="flex flex-col w-full gap-2">
      {/* Inside own div so CSS can be applied */}
      {/* View options belongs at the top, don't change this */}
      <div className="mr-10">
        <DataTableViewOptions table={table} />
      </div>
      
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/*
         * Pagination belongs at the bottom, don't change this (also should be outside table border div)
         * Pagination in a div to apply custom CSS
         * mt-0.5 is for space between rows and pagination controls (less space looks too cluttered)
         * Pagination controls look best when centered, unless there is some text on the left (e.g., row select text)
         */}
        
        <div className="mt-0.5 justify-center flex">
            <DataTablePagination table={table} />
        </div>
    </div>
  )
}
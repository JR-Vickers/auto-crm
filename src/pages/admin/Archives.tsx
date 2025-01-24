import { useState, useEffect } from 'react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { useToast } from '../../components/ui/use-toast'
import { format } from 'date-fns'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Link } from 'react-router-dom'
import { supabase } from '../../integrations/supabase/client'
import type { Database } from '../../integrations/supabase/types'

type ArchivedTicket = Database['public']['Tables']['archived_tickets']['Row']

export default function Archives() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [tickets, setTickets] = useState<ArchivedTicket[]>([])
  const [daysToArchive, setDaysToArchive] = useState('90')

  const columns: ColumnDef<ArchivedTicket>[] = [
    { accessorKey: 'title', header: 'Title' },
    { accessorKey: 'status', header: 'Status' },
    { 
      accessorKey: 'archived_at',
      header: 'Archived At',
      cell: ({ row }) => format(new Date(row.original.archived_at), 'PPp')
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleRestore(row.original.id)}
        >
          Restore
        </Button>
      )
    }
  ]

  const table = useReactTable({
    data: tickets,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const loadArchivedTickets = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('archived_tickets')
      .select('*')
      .order('archived_at', { ascending: false })

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } else {
      setTickets(data || [])
    }
    setLoading(false)
  }

  const handleArchive = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .rpc('archive_old_tickets', { days_old: parseInt(daysToArchive) })

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } else {
      toast({
        title: 'Success',
        description: `Archived ${data} tickets`
      })
      loadArchivedTickets()
    }
    setLoading(false)
  }

  const handleRestore = async (ticketId: string) => {
    setLoading(true)
    const { error } = await supabase
      .rpc('restore_archived_ticket', { ticket_id: ticketId })

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } else {
      toast({
        title: 'Success',
        description: 'Ticket restored successfully'
      })
      loadArchivedTickets()
    }
    setLoading(false)
  }

  useEffect(() => {
    loadArchivedTickets()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Ticket Archives</h1>
        <Button variant="outline" asChild>
          <Link to="/admin">Back to Admin Dashboard</Link>
        </Button>
      </div>
      
      <div className="flex gap-4 mb-8">
        <Input
          type="number"
          value={daysToArchive}
          onChange={(e) => setDaysToArchive(e.target.value)}
          className="w-32"
          min="1"
        />
        <Button 
          onClick={handleArchive}
          disabled={loading}
        >
          Archive Tickets Older Than {daysToArchive} Days
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
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
                  {loading ? 'Loading...' : 'No archived tickets found.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 
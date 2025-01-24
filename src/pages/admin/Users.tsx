import { useState, useEffect } from 'react'
import { Button } from '../../components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { useToast } from '../../components/ui/use-toast'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Link } from 'react-router-dom'
import { supabase } from '../../integrations/supabase/client'
import type { Database } from '../../integrations/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']
type UserRole = 'customer' | 'worker' | 'admin'

export default function Users() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<Profile[]>([])

  const handleRoleChange = async (user: Profile, newRole: UserRole) => {
    if (user.role === newRole) return

    const confirmMessage = `Are you sure you want to change ${user.full_name || 'this user'}'s role from ${user.role} to ${newRole}?`
    if (!confirm(confirmMessage)) return

    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', user.id)

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } else {
      toast({
        title: 'Success',
        description: `User role updated to ${newRole}`
      })
      loadUsers()
    }
    setLoading(false)
  }

  const RoleButton = ({ role, currentRole, onClick }: { role: UserRole, currentRole: UserRole, onClick: () => void }) => (
    <Button
      variant={currentRole === role ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      disabled={loading}
      className={currentRole === role ? 'bg-black hover:bg-black/90' : ''}
    >
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </Button>
  )

  const columns: ColumnDef<Profile>[] = [
    { accessorKey: 'full_name', header: 'Name' },
    { accessorKey: 'role', header: 'Role' },
    { 
      accessorKey: 'created_at', 
      header: 'Created At',
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString()
    },
    {
      id: 'actions',
      header: 'Role Management',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <RoleButton 
            role="customer" 
            currentRole={row.original.role} 
            onClick={() => handleRoleChange(row.original, 'customer')}
          />
          <RoleButton 
            role="worker" 
            currentRole={row.original.role} 
            onClick={() => handleRoleChange(row.original, 'worker')}
          />
          <RoleButton 
            role="admin" 
            currentRole={row.original.role} 
            onClick={() => handleRoleChange(row.original, 'admin')}
          />
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => handleDelete(row.original.id, row.original.full_name || '')}
            disabled={loading}
          >
            Delete
          </Button>
        </div>
      )
    }
  ]

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const loadUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  const handleDelete = async (userId: string, userName: string) => {
    const confirmMessage = `Are you sure you want to delete ${userName || 'this user'}? This action cannot be undone.`
    if (!confirm(confirmMessage)) return

    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } else {
      toast({
        title: 'Success',
        description: `User ${userName || ''} deleted successfully`
      })
      loadUsers()
    }
    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button variant="outline" asChild>
          <Link to="/admin">Back to Admin Dashboard</Link>
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
                  {loading ? 'Loading...' : 'No users found.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 
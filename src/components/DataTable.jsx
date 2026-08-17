import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TextField,
  InputAdornment,
  Box,
  IconButton,
  Tooltip,
  Skeleton,
  CircularProgress,
  Typography,
} from '@mui/material'
import {
  Search,
  FilterList,
  Download,
  Refresh,
} from '@mui/icons-material'
import { alpha } from '@mui/material/styles'

const DataTable = ({
  columns,
  data,
  loading = false,
  onRowClick,
  searchable = true,
  exportable = false,
  onExport,
  onRefresh,
  filters,
  searchPlaceholder = 'Search mission ID, consignee, status...',
}) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const filteredData = searchable
    ? data.filter((row) =>
        columns.some((col) => {
          const value = col.accessor ? col.accessor(row) : row[col.field]
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        })
      )
    : data

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        width: '100%', 
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3
      }}
    >
      <Box
        sx={{
          p: { xs: 2, sm: 2.5 },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {searchable && (
          <TextField
            size="small"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'text.disabled', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={{ 
              width: { xs: '100%', sm: 320 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: '#F8F9FA'
              }
            }}
          />
        )}
        <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-end', sm: 'flex-start' } }}>
          {filters && (
            <Tooltip title="Filters">
              <IconButton size="small" sx={{ mr: 1, border: '1px solid', borderColor: 'divider' }}>
                <FilterList fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onRefresh && (
            <Tooltip title="Refresh">
              <IconButton 
                size="small" 
                onClick={onRefresh} 
                sx={{ mr: 1, border: '1px solid', borderColor: 'divider' }}
              >
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {exportable && onExport && (
            <Tooltip title="Export Data">
              <IconButton 
                size="small" 
                onClick={onExport}
                sx={{ border: '1px solid', borderColor: 'divider' }}
              >
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.field}
                  align={column.align || 'left'}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    color: 'text.secondary',
                    bgcolor: 'white',
                    py: 2,
                    borderBottom: '2px solid',
                    borderColor: 'divider',
                    ...(column.headerPadding ? { px: column.headerPadding === 'checkbox' ? 1 : undefined } : {}),
                  }}
                  padding={column.headerPadding || 'normal'}
                >
                  {column.headerRender
                    ? column.headerRender()
                    : column.headerName || column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {columns.map((column) => (
                    <TableCell key={column.field} sx={{ py: 2.5 }}>
                      <Skeleton variant="text" width="80%" height={24} sx={{ borderRadius: 1 }} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    No records found matching your criteria.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow
                  key={row.id || index}
                  hover
                  onClick={() => onRowClick && onRowClick(row)}
                  sx={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    '&:hover': {
                      bgcolor: alpha('#01A3DA', 0.04) + ' !important'
                    },
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {columns.map((column) => (
                    <TableCell 
                      key={column.field} 
                      align={column.align || 'left'}
                      padding={column.cellPadding || 'normal'}
                      onClick={(e) => {
                        if (column.stopRowClick) e.stopPropagation()
                      }}
                      sx={{ 
                        py: 2,
                        fontSize: '0.875rem',
                        fontWeight: column.field === 'shipment_number' ? 700 : 400,
                        color: row.is_overdue && column.field === 'shipment_number' ? 'error.main' : 'text.primary'
                      }}
                    >
                      {column.render
                        ? column.render(row)
                        : column.accessor
                        ? column.accessor(row)
                        : row[column.field]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredData.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 25, 50]}
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'text.secondary'
          }
        }}
      />
    </Paper>
  )
}

export default DataTable

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
} from '@mui/material'
import {
  Search,
  FilterList,
  Download,
  Refresh,
} from '@mui/icons-material'

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
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        {searchable && (
          <TextField
            size="small"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
        )}
        <Box>
          {filters && (
            <Tooltip title="Filters">
              <IconButton size="small" sx={{ mr: 1 }}>
                <FilterList />
              </IconButton>
            </Tooltip>
          )}
          {onRefresh && (
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={onRefresh} sx={{ mr: 1 }}>
                <Refresh />
              </IconButton>
            </Tooltip>
          )}
          {exportable && onExport && (
            <Tooltip title="Export">
              <IconButton size="small" onClick={onExport}>
                <Download />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.field}
                  align={column.align || 'left'}
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5',
                  }}
                >
                  {column.headerName || column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: rowsPerPage }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {columns.map((column) => (
                    <TableCell key={column.field}>
                      <Skeleton variant="text" width="100%" height={20} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  No data available
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
                    backgroundColor: row.is_overdue ? 'error.light' : 'inherit',
                    '&:hover': onRowClick
                      ? {
                          backgroundColor: row.is_overdue ? 'error.main' : 'action.hover',
                        }
                      : {},
                  }}
                >
                  {columns.map((column) => (
                    <TableCell key={column.field} align={column.align || 'left'}>
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
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Paper>
  )
}

export default DataTable





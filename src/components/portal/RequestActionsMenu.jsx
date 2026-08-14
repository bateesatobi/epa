import React, { useState } from 'react'
import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from '@mui/material'
import { MoreVert, Visibility, EditOutlined, DeleteOutline } from '@mui/icons-material'

export default function RequestActionsMenu({
  onView,
  onUpdate,
  onDelete,
  canUpdate = true,
  canDelete = true,
  disabled = false,
}) {
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  const close = () => setAnchorEl(null)

  const run = (action) => {
    close()
    action?.()
  }

  return (
    <>
      <IconButton
        size="small"
        aria-label="Request actions"
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation()
          setAnchorEl(e.currentTarget)
        }}
        sx={{
          color: 'text.secondary',
          '&:hover': { bgcolor: '#F1F5F9', color: 'text.primary' },
        }}
      >
        <MoreVert fontSize="small" />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              minWidth: 168,
              borderRadius: 2,
              border: '1px solid #E2E8F0',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.1)',
            },
          },
        }}
      >
        <MenuItem onClick={() => run(onView)}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }}>View</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => run(onUpdate)} disabled={!canUpdate}>
          <ListItemIcon>
            <EditOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }}>Update</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => run(onDelete)}
          disabled={!canDelete}
          sx={{ color: canDelete ? 'error.main' : undefined }}
        >
          <ListItemIcon>
            <DeleteOutline fontSize="small" color={canDelete ? 'error' : 'disabled'} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }}>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}

import React from 'react'
import { TextField, Box, InputAdornment } from '@mui/material'

const FormTextField = ({
  label,
  value,
  onChange,
  error,
  helperText,
  required = false,
  fullWidth = true,
  margin = 'normal',
  type = 'text',
  multiline = false,
  rows = 1,
  disabled = false,
  autoFocus = false,
  placeholder,
  startAdornment,
  endAdornment,
  sx = {},
  ...props
}) => {
  return (
    <Box sx={{ mb: margin === 'normal' ? 2 : 0, ...sx }}>
      <TextField
        fullWidth={fullWidth}
        label={label}
        value={value}
        onChange={onChange}
        error={!!error}
        helperText={error || helperText}
        required={required}
        type={type}
        multiline={multiline}
        rows={rows}
        disabled={disabled}
        autoFocus={autoFocus}
        placeholder={placeholder}
        variant="outlined"
        InputProps={{
          startAdornment: startAdornment ? (
            <InputAdornment position="start">{startAdornment}</InputAdornment>
          ) : undefined,
          endAdornment: endAdornment ? (
            <InputAdornment position="end">{endAdornment}</InputAdornment>
          ) : undefined,
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            '&:hover fieldset': {
              borderColor: 'primary.main',
            },
            '&.Mui-focused fieldset': {
              borderWidth: 2,
            },
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: 'primary.main',
          },
        }}
        {...props}
      />
    </Box>
  )
}

export default FormTextField


import React, { useState } from 'react'
import { TextField, Box, InputAdornment, IconButton } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'

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
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const displayType = isPassword ? (showPassword ? 'text' : 'password') : type

  const passwordToggleAdornment = isPassword ? (
    <InputAdornment position="end">
      <IconButton
        aria-label="toggle password visibility"
        onClick={() => setShowPassword(!showPassword)}
        onMouseDown={(e) => e.preventDefault()}
        edge="end"
      >
        {showPassword ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </InputAdornment>
  ) : endAdornment ? (
    <InputAdornment position="end">{endAdornment}</InputAdornment>
  ) : undefined

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
        type={displayType}
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
          endAdornment: passwordToggleAdornment,
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


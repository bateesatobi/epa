import React from 'react'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
} from '@mui/material'

const FormSelect = ({
  label,
  value,
  onChange,
  options = [],
  error,
  helperText,
  required = false,
  fullWidth = true,
  margin = 'normal',
  disabled = false,
  multiple = false,
  renderValue,
  sx = {},
  ...props
}) => {
  return (
    <Box sx={{ mb: margin === 'normal' ? 2 : 0, ...sx }}>
      <FormControl
        fullWidth={fullWidth}
        required={required}
        error={!!error}
        disabled={disabled}
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
      >
        <InputLabel id={`${label}-label`}>{label}</InputLabel>
        <Select
          labelId={`${label}-label`}
          value={value}
          onChange={onChange}
          label={label}
          multiple={multiple}
          renderValue={renderValue}
          {...props}
        >
          {options.map((option) => {
            if (typeof option === 'object') {
              return (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              )
            }
            return (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            )
          })}
        </Select>
        {(error || helperText) && (
          <FormHelperText>{error || helperText}</FormHelperText>
        )}
      </FormControl>
    </Box>
  )
}

export default FormSelect


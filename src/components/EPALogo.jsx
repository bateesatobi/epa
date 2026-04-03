import React, { useState } from 'react'
import { Box, Typography } from '@mui/material'

/**
 * EPA Logo Component - Professional branding component
 * 
 * Usage:
 * <EPALogo width={150} height={50} />
 */

const EPALogo = ({ 
  width = 'auto', 
  height = 50, 
  variant = 'default',
  sx = {} 
}) => {
  const [imgError, setImgError] = useState(false)
  
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: width,
        height: height,
        transition: 'all 0.3s ease',
        ...sx,
      }}
    >
      <img 
        src="/logo.png" 
        alt="EPA Dashboard Logo" 
        style={{
          height: '100%',
          width: 'auto',
          objectFit: 'contain',
          marginRight: '12px'
        }}
        onError={() => setImgError(true)}
      />
      
      {!imgError && (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 800, 
              lineHeight: 1,
              color: variant === 'white' ? '#FFFFFF' : '#01A3DA',
              letterSpacing: '-0.5px',
              fontSize: height >= 50 ? '1.25rem' : '1rem'
            }}
          >
            EPA
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              fontWeight: 700,
              lineHeight: 1, 
              color: variant === 'white' ? 'rgba(255,255,255,0.8)' : 'text.secondary',
              letterSpacing: '0.5px',
              mt: 0.5,
              fontSize: height >= 50 ? '0.75rem' : '0.65rem'
            }}
          >
            CARRIERS & LOGISTICS
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default EPALogo

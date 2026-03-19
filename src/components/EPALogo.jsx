import React, { useState } from 'react'
import { Box } from '@mui/material'

/**
 * EPA Logo Component - Professional branding component
 * 
 * Usage:
 * <EPALogo width={150} height={50} />
 */

const EPALogo = ({ 
  width = 150, 
  height = 'auto', 
  variant = 'default', // 'default', 'white', 'dark', 'compact'
  sx = {} 
}) => {
  const [imgError, setImgError] = useState(false)
  
  // Calculate height if auto
  const logoHeight = height === 'auto' ? width * 0.4 : height
  
  // Color scheme for SVG fallback
  const getColors = () => {
    switch (variant) {
      case 'white':
        return {
          primary: '#FFFFFF',
          secondary: '#F0F0F0',
          accent: '#01A3DA',
        }
      case 'dark':
        return {
          primary: '#000000',
          secondary: '#333333',
          accent: '#01A3DA',
        }
      default:
        return {
          primary: '#01A3DA',
          secondary: '#000000',
          accent: '#01A3DA',
        }
    }
  }

  const colors = getColors()

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: width,
        height: logoHeight,
        transition: 'all 0.3s ease',
        ...sx,
      }}
    >
      <svg
        width={width}
        height={logoHeight}
        viewBox="0 0 240 80"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        <defs>
          <linearGradient id={`epaGradient-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: colors.primary, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: colors.accent, stopOpacity: 1 }} />
          </linearGradient>
          
          <linearGradient id={`epaGradientLight-${variant}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: colors.accent, stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: colors.primary, stopOpacity: 0.9 }} />
          </linearGradient>
        </defs>
        
        {/* Shield / Badge Icon */}
        <g transform="translate(10, 15)">
          {/* Outer Shield */}
          <path
            d="M 25 0 L 50 10 L 50 25 C 50 40 38 52 25 58 C 12 52 0 40 0 25 L 0 10 Z"
            fill="none"
            stroke={`url(#epaGradient-${variant})`}
            strokeWidth="3"
          />
          {/* Inner Shield Element */}
          <path
            d="M 25 6 L 42 13 L 42 25 C 42 36 33 45 25 50 C 17 45 8 36 8 25 L 8 13 Z"
            fill={`url(#epaGradientLight-${variant})`}
            opacity="0.85"
          />
          {/* Checkmark inside shield */}
          <path
            d="M 16 26 L 22 32 L 34 18"
            fill="none"
            stroke={variant === 'white' ? '#0A192F' : '#FFFFFF'}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Typography: EPA */}
        <text
          x="75"
          y="48"
          fontSize="46"
          fontWeight="900"
          fontFamily="'Inter', 'Segoe UI', 'Roboto', sans-serif"
          fill={colors.primary}
          letterSpacing="-1px"
        >
          EPA
        </text>

        {/* Subtitle: LOGISTICS COCKPIT */}
        <text
          x="77"
          y="64"
          fontSize="11"
          fontWeight="700"
          fontFamily="'Inter', 'Segoe UI', 'Roboto', sans-serif"
          fill={colors.accent}
          letterSpacing="2.5px"
          opacity={0.9}
        >
          LOGISTICS COCKPIT
        </text>
      </svg>
    </Box>
  )
}

export default EPALogo

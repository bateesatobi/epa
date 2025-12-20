import React from 'react'
import { Box } from '@mui/material'

/**
 * EPA Logo Component - SVG-based logo that always works
 * 
 * Usage:
 * <EPALogo width={150} height={50} />
 * 
 * This component creates a professional logo using SVG instead of image files
 */

const EPALogo = ({ 
  width = 150, 
  height = 'auto', 
  variant = 'default', // 'default', 'white', 'dark', 'compact'
  sx = {} 
}) => {
  // Calculate height if auto
  const logoHeight = height === 'auto' ? width * 0.4 : height
  
  // Color scheme based on variant
  const getColors = () => {
    switch (variant) {
      case 'white':
        return {
          primary: '#FFFFFF',
          secondary: '#F0F0F0',
          accent: '#E0E0E0',
        }
      case 'dark':
        return {
          primary: '#1a1a1a',
          secondary: '#333333',
          accent: '#4a4a4a',
        }
      default:
        return {
          primary: '#1976d2', // Material-UI primary blue
          secondary: '#1565c0',
          accent: '#0d47a1',
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
        ...sx,
      }}
    >
      <svg
        width={width}
        height={logoHeight}
        viewBox="0 0 240 80"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id={`epaGradient-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: colors.primary, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: colors.secondary, stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        
        {/* Icon/Logo Mark - Professional geometric design */}
        <g transform="translate(5, 15)">
          {/* Main "E" shape with modern styling */}
          <rect x="0" y="0" width="4" height="50" rx="2" fill={colors.primary} />
          <rect x="0" y="0" width="30" height="4" rx="2" fill={colors.primary} />
          <rect x="0" y="23" width="25" height="4" rx="2" fill={colors.primary} />
          <rect x="0" y="46" width="30" height="4" rx="2" fill={colors.primary} />
          
          {/* Forward arrow indicating movement/speed */}
          <path
            d="M 35 25 L 42 25 L 38.5 18 Z"
            fill={colors.accent}
          />
          <path
            d="M 35 25 L 42 25 L 38.5 32 Z"
            fill={colors.accent}
          />
        </g>

        {/* Text: EPA - Bold and professional */}
        <text
          x="55"
          y="48"
          fontSize={variant === 'compact' ? '24' : '36'}
          fontWeight="800"
          fontFamily="'Segoe UI', 'Roboto', 'Arial', sans-serif"
          fill={colors.primary}
          letterSpacing="3px"
        >
          EPA
        </text>

        {/* Subtitle: COURIERS (if not compact) */}
        {variant !== 'compact' && (
          <text
            x="55"
            y="62"
            fontSize="11"
            fontWeight="600"
            fontFamily="'Segoe UI', 'Roboto', 'Arial', sans-serif"
            fill={colors.secondary}
            letterSpacing="2px"
            opacity={0.85}
          >
            COURIERS
          </text>
        )}
      </svg>
    </Box>
  )
}

export default EPALogo

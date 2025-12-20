/**
 * EXAMPLE: Refactored Dashboard using React Query hooks
 * This shows how to use the caching hooks instead of manual state management
 * 
 * To use: Replace the current Dashboard.jsx with this implementation
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Stack,
  Tooltip,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import {
  LocalShipping,
  TrendingUp,
  CheckCircle,
  Warning,
  Refresh,
  PendingActions,
  DirectionsBoatFilled,
  TaskAlt,
  Timeline,
  Insights,
  PeopleAlt,
  DonutLarge,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import {
  BarChart,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'

// Import React Query hooks
import {
  useKPIs,
  useActivityAnalytics,
  useFieldStaffAnalytics,
  useOverdueAnalytics,
  useTimelineAnalytics,
  useAlerts,
} from '../hooks/useReports'
import { useShipments } from '../hooks/useShipments'

// ... (StatCard and SecondaryStatCard components remain the same)

const Dashboard = () => {
  const navigate = useNavigate()

  // OPTIMIZATION: Use React Query hooks instead of manual state + useEffect
  // These automatically handle caching, refetching, and loading states
  
  const {
    data: kpis,
    isLoading: kpisLoading,
    refetch: refetchKPIs,
  } = useKPIs()

  const {
    data: activityAnalytics,
    isLoading: activityLoading,
  } = useActivityAnalytics()

  const {
    data: fieldStaffAnalytics,
    isLoading: fieldStaffLoading,
  } = useFieldStaffAnalytics()

  const {
    data: overdueAnalytics,
    isLoading: overdueLoading,
  } = useOverdueAnalytics()

  const {
    data: timelineAnalytics,
    isLoading: timelineLoading,
  } = useTimelineAnalytics(7) // Last 7 days

  const {
    data: shipmentsData,
    isLoading: shipmentsLoading,
  } = useShipments({ limit: 10 })

  const {
    data: alerts,
    isLoading: alertsLoading,
  } = useAlerts()

  // Combined loading state
  const loading = kpisLoading || activityLoading || fieldStaffLoading || 
                  overdueLoading || timelineLoading || shipmentsLoading || alertsLoading

  // Extract data
  const shipments = shipmentsData?.items || []

  const handleRefresh = () => {
    // React Query will automatically refetch all queries
    refetchKPIs()
    toast.info('Refreshing data...')
  }

  if (loading && !kpis) {
    return (
      <Box>
        <LinearProgress />
      </Box>
    )
  }

  // ... rest of the component logic remains the same
  // The data is now automatically cached and will be reused across component mounts

  return (
    <Box>
      {/* ... component JSX ... */}
    </Box>
  )
}

export default Dashboard


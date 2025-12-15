/**
 * Unified Theme & Color System
 * All pages must use these colors for consistency
 */

export const THEME = {
  // Primary Actions (View buttons, main CTAs)
  primary: {
    bg: '#1B5E20',  // Dark green
    bgHover: '#1B5E20',
    bgOpacity: 'hover:bg-[#1B5E20]/90',
    text: 'text-white',
    className: 'bg-[#1B5E20] text-white hover:bg-[#1B5E20]/90',
  },

  // Status Badges
  status: {
    filled: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      full: 'bg-green-100 text-green-700',
    },
    partial: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      full: 'bg-yellow-100 text-yellow-700',
    },
    notFilled: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      full: 'bg-red-100 text-red-700',
    },
  },

  // Modal/Dialog
  modal: {
    bg: 'bg-white',
    text: 'text-[#2E3A3F]',
    border: 'border-gray-200',
    closeButton: 'text-2xl',
    overlay: 'bg-black/40',
  },

  // Table
  table: {
    wrapper: 'w-full overflow-auto border rounded-lg bg-white shadow',
    table: 'w-full text-sm',
    thead: 'bg-gray-100 sticky top-0 z-10 border-b',
    theadText: 'p-3 font-semibold text-left cursor-pointer text-[#2E3A3F]',
    header: 'bg-gray-100',
    headerText: 'text-[#2E3A3F]',
    rowEven: 'bg-white',
    rowOdd: 'bg-gray-50',
    rowHover: 'hover:bg-[#7CB342]/10 transition-colors',
    cell: 'p-3 border-b text-[#2E3A3F]',
    border: 'border-[#6D4C41]/10',
  },

  // Text Colors
  text: {
    primary: 'text-[#2E3A3F]',
    secondary: 'text-[#2E3A3F]/70',
    label: 'text-sm font-medium text-[#2E3A3F]',
  },

  // Button Styles
  buttons: {
    primary: 'px-3 py-1 text-sm rounded-lg bg-[#1B5E20] text-white hover:bg-[#1B5E20]/90 font-medium',
    secondary: 'px-3 py-1 text-sm rounded border border-[#6D4C41]/20 bg-white text-[#2E3A3F] hover:bg-[#7CB342]/10',
    pagination: 'border px-3 py-2 rounded disabled:opacity-50 hover:bg-[#7CB342]/10',
  },

  // Input/Select
  input: {
    border: 'border border-[#6D4C41]/20',
    borderRounded: 'border rounded border-[#6D4C41]/20 px-3',
    focus: 'focus:outline-none focus:ring-2 focus:ring-[#1B5E20]/50',
  },

  // Card/Container
  card: {
    bg: 'bg-white',
    border: 'border border-[#6D4C41]/20',
    shadow: 'shadow-sm',
    className: 'bg-white border border-[#6D4C41]/20 rounded-lg p-4 shadow-sm',
  },

  // Background
  background: {
    page: 'bg-[#F5E9D4]/20',
  },
};

// Helper function to get status color
export function getStatusColor(status: 'filled' | 'partial' | 'not_filled') {
  return THEME.status[status === 'not_filled' ? 'notFilled' : status];
}

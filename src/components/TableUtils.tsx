import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: React.ReactNode;
}

interface TableBodyProps {
  children: React.ReactNode;
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

// Ana tablo bileşeni - Gelirler sayfasından alınan tasarım
export const Table: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <div className="bg-white p-4 rounded-md shadow overflow-x-auto">
      <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
        {children}
      </table>
    </div>
  );
};

// Tablo başlık bölümü
export const TableHeader: React.FC<TableHeaderProps> = ({ children }) => {
  return (
    <thead className="bg-gray-100">
      {children}
    </thead>
  );
};

// Tablo gövde bölümü
export const TableBody: React.FC<TableBodyProps> = ({ children }) => {
  return (
    <tbody className="divide-y divide-gray-200">
      {children}
    </tbody>
  );
};

// Tablo satırı - Gelirler sayfasındaki hover efekti ile
export const TableRow: React.FC<TableRowProps> = ({ children, className = '', onClick }) => {
  const baseClasses = "text-sm text-gray-800 border-b hover:bg-gray-50 transition";
  const combinedClasses = `${baseClasses} ${className}`;
  
  return (
    <tr className={combinedClasses} onClick={onClick}>
      {children}
    </tr>
  );
};

// Tablo hücre başlığı
export const TableHeaderCell: React.FC<TableCellProps> = ({ children, className = '', align = 'left' }) => {
  const alignClass = align === 'left' ? 'text-left' : align === 'center' ? 'text-center' : 'text-right';
  
  return (
    <th className={`px-4 py-2 font-bold ${alignClass} text-xs text-gray-700 uppercase ${className}`}>
      {children}
    </th>
  );
};

// Tablo hücresi - Gelirler sayfasındaki stil ile
export const TableCell: React.FC<TableCellProps> = ({ children, className = '', align = 'left' }) => {
  const alignClass = align === 'left' ? 'text-left' : align === 'center' ? 'text-center' : 'text-right';
  
  return (
    <td className={`px-4 py-2 ${alignClass} font-semibold ${className}`}>
      {children}
    </td>
  );
};

// Durum etiketi bileşeni - Gelirler sayfasındaki tasarım
interface StatusBadgeProps {
  status: 'tahsilEdildi' | 'bekleniyor' | 'kesinlesen' | 'odendi' | 'odenmesiGereken';
  children: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, children }) => {
  const getStatusClasses = () => {
    switch (status) {
      case 'tahsilEdildi':
      case 'odendi':
        return 'bg-green-100 text-green-700';
      case 'bekleniyor':
      case 'odenmesiGereken':
        return 'bg-yellow-100 text-yellow-700';
      case 'kesinlesen':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusClasses()}`}>
      {children}
    </span>
  );
};

// İşlem butonu - Gelirler sayfasındaki tasarım
interface ActionButtonProps {
  onClick: () => void;
  variant?: 'primary' | 'success';
  children: React.ReactNode;
  className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ 
  onClick, 
  variant = 'success', 
  children, 
  className = '' 
}) => {
  const variantClasses = variant === 'primary' 
    ? 'bg-blue-500 text-white hover:bg-blue-600' 
    : 'bg-green-500 text-white hover:bg-green-600';

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${variantClasses} ${className}`}
    >
      {children}
    </button>
  );
}; 
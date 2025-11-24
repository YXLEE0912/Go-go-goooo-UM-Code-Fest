"use client"

export const Button = ({ children, onClick, variant = "primary", className = "", icon: Icon }: any) => {
  const baseStyle =
    "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20",
    secondary: "bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20",
    outline: "border border-white/20 hover:bg-white/10 text-gray-300 backdrop-blur-sm",
    danger: "bg-red-500 hover:bg-red-600 text-white",
  }

  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  )
}

export const Input = ({ type = "text", placeholder, className = "", value, onChange, onKeyPress }: any) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    onKeyPress={onKeyPress}
    className={`w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 backdrop-blur-md focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-white placeholder-gray-400 ${className}`}
  />
)

export const Card = ({ children, className = "" }: any) => (
  <div className={`bg-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 ${className}`}>
    {children}
  </div>
)

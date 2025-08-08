const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-gradient-to-r from-primary-600 to-purple-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="text-lg font-bold text-gradient">MindCanvus</span>
          </div>
          
          <div className="text-gray-600 text-sm">
            © 2024 MindCanvus. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

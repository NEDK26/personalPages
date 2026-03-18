import { Mail, Moon } from "lucide-react";

import avatarImage from "../assets/avatar.jpg";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 to-purple-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl">去顽野</h1>
            <Moon className="w-5 h-5" />
          </div>
          <div className="text-sm text-gray-600">7:00</div>
        </div>

        <nav className="flex gap-6 mb-12 text-gray-700">
          <a href="#" className="hover:text-gray-900 transition-colors">About</a>
          <a href="#" className="hover:text-gray-900 transition-colors">Post</a>
          <a href="#" className="hover:text-gray-900 transition-colors">Tags</a>
          <a href="#" className="hover:text-gray-900 transition-colors">Search</a>
        </nav>

        <div className="flex flex-col items-center text-center">
          <div className="w-48 h-48 mb-8 bg-purple-100 rounded-full overflow-hidden border-4 border-white shadow-lg">
            <img
              src={avatarImage}
              alt="Profile Avatar"
              className="w-full h-full object-cover"
            />
          </div>

          <h2 className="text-3xl mb-4">去顽野</h2>

          <p className="text-gray-700 mb-8 leading-relaxed">
            产品设计师 | MoFlow产品负责人 | 独立开发者
          </p>

          <div className="flex gap-6 mb-12">
            <a href="#" className="text-gray-800 hover:text-gray-600 transition-colors">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <a href="#" className="text-gray-800 hover:text-gray-600 transition-colors">
              <Mail className="w-8 h-8" />
            </a>
            <a href="#" className="text-gray-800 hover:text-gray-600 transition-colors">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </a>
          </div>

          <div className="flex gap-4">
            <button className="px-10 py-3 bg-purple-200/60 hover:bg-purple-300/60 rounded-2xl transition-colors backdrop-blur-sm">
              Post
            </button>
            <button className="px-10 py-3 bg-purple-200/60 hover:bg-purple-300/60 rounded-2xl transition-colors backdrop-blur-sm">
              Tags
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

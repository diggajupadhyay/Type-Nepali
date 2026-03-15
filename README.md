# Type Nepali Browser Extension ⌨️✨

<p align="center">
<img src="img/icons/icon-128.png" alt="Type Nepali Extension Logo" width="128" />
</p>

<p align="center">
A browser extension that gives your browser the power to type in Nepali using English keyboard input.
</p>

<p align="center">
<a href="#features">Features</a> •
<a href="#installation">Installation</a> •
<a href="#usage">Usage</a> •
<a href="#development">Development</a> •
<a href="#contributing">Contributing</a>
</p>

---

## 🌟 Features

- **Real-time Transliteration**: Type in English and get Nepali text instantly
- **Smart Caching**: 300+ common words translated instantly without API calls
- **Works Everywhere**: Compatible with all websites and text input fields
- **Keyboard Shortcut**: Toggle with `Ctrl+Alt+N` (Windows/Linux) or `Cmd+Alt+N` (Mac)
- **Customizable Settings**: Font size, font family, and typing preferences
- **Offline Fallback**: Graceful handling when API is unavailable
- **Accessible**: WCAG compliant with keyboard navigation support
- **Privacy First**: No data collection, all processing happens locally or via Google API

### Example

![Extension Demo](./img/extension-pic.png)

**"Jay Nepal"** becomes **"जय नेपाल"**

---

## 📥 Installation

### From Firefox Add-ons (Recommended)
> Coming soon to Firefox Add-ons store

### Manual Installation (Development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/diggajupadhyay/Type-Nepali.git
   cd Type-Nepali
   ```

2. **Install dependencies** (for development)
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Firefox**
   - Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file from the `dist/` folder

5. **Load in Chrome** (experimental)
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` folder

---

## 🚀 Usage

### Basic Usage

1. Click the extension icon in your browser toolbar
2. Click **On** to enable Nepali typing
3. Go to any website with a text input (Facebook, Twitter, Gmail, etc.)
4. Type in English (e.g., "namaste")
5. Press **Space** to convert to Nepali (e.g., "नमस्ते")

### Keyboard Shortcut

| Platform | Shortcut |
|----------|----------|
| Windows/Linux | `Ctrl` + `Alt` + `N` |
| Mac | `Cmd` + `Alt` + `N` |

### Examples

| English | Nepali |
|---------|--------|
| namaste | नमस्ते |
| nepal | नेपाल |
| jay nepal | जय नेपाल |
| dhanyabad | धन्यवाद |
| kathmandu | काठमाडौं |

### Settings

Access settings by clicking the extension icon → **Settings**:

- **Auto-convert on spacebar**: Enable/disable automatic conversion
- **Convert punctuation**: Replace English "." with Nepali "।"
- **Font size**: Adjust Nepali text display size
- **Font family**: Choose preferred font style
- **Statistics**: View words translated and cache hits

---

## 🛠️ Development

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Firefox >= 100 (for testing)

### Setup

```bash
# Install dependencies
npm install

# Run linter
npm run lint

# Format code
npm run format

# Build extension
npm run build

# Build and watch for changes
npm run dev

# Create distribution zip
npm run zip
```

### Project Structure

```
Type-Nepali/
├── scripts/
│   ├── background.js      # Background service worker
│   ├── content.js         # Content script (transliteration logic)
│   ├── popup.js           # Popup UI logic
│   ├── settings.js        # Settings page logic
│   ├── build.js           # Build script
│   └── validate-manifest.js
├── img/                   # Icons and images
├── popup.html             # Extension popup
├── popup-styles.css       # Popup styles
├── settings.html          # Settings page
├── help.html              # Help page
├── manifest.json          # Extension manifest
├── package.json           # Node.js dependencies
├── .eslintrc.json         # ESLint configuration
├── .prettierrc            # Prettier configuration
└── README.md
```

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run format` | Format code with Prettier |
| `npm run build` | Build extension to dist/ |
| `npm run dev` | Watch mode for development |
| `npm run zip` | Create distributable zip |
| `npm run validate:manifest` | Validate manifest.json |

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Style

- Follow ESLint rules
- Use Prettier for formatting
- Write JSDoc comments for functions
- Keep functions small and focused

---

## 📄 License

MIT License - feel free to use and modify!

---

## 🙏 Acknowledgments

- Uses [Google Input Tools API](https://www.google.com/inputtools/request) for transliteration
- Inspired by the need for easy Nepali typing across the web

---

## 📬 Support

- **Issues**: [GitHub Issues](https://github.com/diggajupadhyay/Type-Nepali/issues)
- **Discussions**: [GitHub Discussions](https://github.com/diggajupadhyay/Type-Nepali/discussions)

---

<p align="center">
Made with ❤️ for the Nepali community
</p>

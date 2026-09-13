function Header({
  language,
  setLanguage,
  theme,
  setTheme,
  joined,
  runCode,
  isRunning,
}) {

  return (
    <header className="header">

      <div className="brand">
        <span className="brand-mark">
          &lt;/&gt;
        </span>

        <span className="brand-name">
          CodeCollab
        </span>
      </div>


      <div className="header-actions">

        <select
          value={language}
          onChange={(e) =>
            setLanguage(e.target.value)
          }
        >
          <option value="javascript">
            JavaScript
          </option>

          <option value="cpp">
            C++
          </option>

          <option value="python">
            Python
          </option>

          <option value="java">
            Java
          </option>
        </select>


        <button
          className="theme-btn"
          onClick={() =>
            setTheme(
              theme === "vs-dark"
                ? "light"
                : "vs-dark"
            )
          }
        >
          {theme === "vs-dark" ? "☀" : "☾"}
        </button>


        <button
          className="run-btn"
          onClick={runCode}
          disabled={!joined || isRunning}
        >
          {isRunning ? "Running..." : "▶ Run"}
        </button>

      </div>

    </header>
  );
}

export default Header;
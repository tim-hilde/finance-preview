/* ColorPicker — popover with 6 shades of the asset's category */
const { useRef: useRCP, useEffect: useECP } = React;

function ColorPicker({ kind, shadeIndex, onChange, onClose, anchorRef }) {
  const ref = useRCP(null);

  useECP(() => {
    function onDown(e) {
      if (ref.current?.contains(e.target)) return;
      if (anchorRef?.current?.contains(e.target)) return;
      onClose();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose, anchorRef]);

  return (
    <div ref={ref} className="color-picker" role="listbox" aria-label="Farbschattierung wählen">
      {Array.from({ length: 6 }, (_, i) => (
        <button
          key={i}
          type="button"
          role="option"
          aria-selected={i === shadeIndex}
          className={"color-swatch" + (i === shadeIndex ? " is-active" : "")}
          style={{ background: `var(--c-${kind}-${i})` }}
          onClick={() => { onChange(i); onClose(); }}
          title={`Shade ${i + 1}`}
        />
      ))}
    </div>
  );
}

window.ColorPicker = ColorPicker;

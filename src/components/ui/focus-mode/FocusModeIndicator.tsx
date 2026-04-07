import { useFocusMode } from '../../../contexts/FocusModeContext';

export const FocusModeIndicator: React.FC = () => {
  const { isFocusMode, disableFocusMode } = useFocusMode();

  if (!isFocusMode) return null;

  return (
    <>
      {/* Top banner only */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-purple-600 text-white py-2 px-4 text-center text-sm">
        Focus Mode Active - Distractions Hidden
        <button 
          onClick={disableFocusMode}
          className="ml-4 underline hover:text-purple-200"
        >
          Exit Focus Mode
        </button>
      </div>

      {/* Add padding to body to account for banner */}
      <style>{`
        body.focus-mode-active {
          padding-top: 32px !important;
        }
      `}</style>
    </>
  );
};

export default FocusModeIndicator;

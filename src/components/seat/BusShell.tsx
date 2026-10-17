import React from 'react';

export interface BusShellProps {
  logo?: string;
  agencyName?: string;
  children: React.ReactNode;
}

/**
 * The physical bus: rounded body, window rails, luggage rails, a soft roof
 * light, and the entry door. Children (seat rows + driver cabin) render inside.
 */
const BusShell: React.FC<BusShellProps> = ({ logo, agencyName, children }) => (
  <div className="bus-shell" role="group" aria-label={agencyName ? `${agencyName} bus` : 'Bus'}>
    {/* Window rails down each side */}
    <span className="bus-shell__window-rail bus-shell__window-rail--left" />
    <span className="bus-shell__window-rail bus-shell__window-rail--right" />
    {/* Luggage rack rails */}
    <span className="bus-shell__luggage-rail" style={{ left: '18px' }} />
    <span className="bus-shell__luggage-rail" style={{ right: '18px' }} />
    {/* Roof light wash + depth vignette */}
    <span className="bus-shell__roof-light" />
    <span className="bus-shell__vignette" />
    {/* Entry door (right side, just behind the driver) */}
    <span className="bus-shell__door" />
    <span className="bus-shell__door-step" />
    <span className="bus-shell__handrail" />

    <div
      style={{
        position: 'relative',
        zIndex: 1,
        padding: 'var(--shell-pad)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--row-gap)',
      }}
    >
      {logo && (
        <img src={logo} alt={agencyName ? `${agencyName} logo` : 'Agency'} className="bus-driver__logo" style={{ alignSelf: 'center' }} />
      )}
      {children}
    </div>
  </div>
);

export default BusShell;

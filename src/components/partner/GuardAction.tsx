import React from "react";
import { usePartnerAuth } from "../../context/PartnerAuthContext";
import { useProfileGuard } from "../../context/ProfileGuardContext";

interface GuardActionProps {
  onAllowed: () => void;
  children: (onClick: () => void) => React.ReactNode;
}

/**
 * Wraps an action (button click, navigation, etc.) so that guests
 * are prompted to complete their profile before the action runs.
 *
 * Usage:
 *   <GuardAction onAllowed={() => navigate("/partner/venues/new")}>
 *     {(onClick) => <button onClick={onClick}>Add Venue</button>}
 *   </GuardAction>
 */
const GuardAction: React.FC<GuardActionProps> = ({ onAllowed, children }) => {
  const { isGuest } = usePartnerAuth();
  const { openCompleteProfile } = useProfileGuard();

  const handleClick = () => {
    if (isGuest) {
      openCompleteProfile(onAllowed);
    } else {
      onAllowed();
    }
  };

  return <>{children(handleClick)}</>;
};

export default GuardAction;
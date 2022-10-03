
import React, { useState, useLayoutEffect, ReactNode } from 'react';
import ReactDOM from 'react-dom';

type Props = {
    children: React.ReactNode;
}

const RootPortal = React.memo((props: Props) => {
  const [el] = useState(document.createElement('div'));
  const rootPortal = document.getElementById('focalboard-root-portal');

  useLayoutEffect(() => {
    if (rootPortal) {
      rootPortal.appendChild(el);
    }
    return () => {
      if (rootPortal) {
        rootPortal.removeChild(el);
      }
    };
  }, []);

    return ReactDOM.createPortal(props.children, el)  // eslint-disable-line
});

export default RootPortal;

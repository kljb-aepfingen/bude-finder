const SpinnerSVG = () => {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-12 h-12" stroke="currentColor" fill="currentColor">
    <g>
      <path
        d="M50 15A35 35 0 1 0 74.74873734152916 25.251262658470843"
        fill="none"
        strokeWidth="12"
      />
      <path
        d="M49 3L49 27L61 15L49 3"
      />
      <animateTransform
        attributeName="transform"
        type="rotate"
        repeatCount="indefinite"
        dur="1s"
        values="0 50 50;360 50 50"
        keyTimes="0;1"
      />
    </g>
  </svg>
}

export default SpinnerSVG
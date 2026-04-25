import React, { useEffect, useRef } from "react";
import { Renderer, Stave, StaveNote, Formatter } from "vexflow";

const VexFlowMelody = () => {
  const containerRef = useRef();

  useEffect(() => {
    const div = containerRef.current;
    div.innerHTML = ""; // Clear previous render
    const renderer = new Renderer(div, Renderer.Backends.SVG);
    renderer.resize(500, 200);
    const context = renderer.getContext();

    // Measure 1
    const stave1 = new Stave(10, 40, 200);
    stave1.addClef("treble").addTimeSignature("4/4");
    stave1.setContext(context).draw();

    const notes1 = [
      new StaveNote({ keys: ["c/4"], duration: "q" }),
      new StaveNote({ keys: ["d/4"], duration: "q" }),
      new StaveNote({ keys: ["e/4"], duration: "q" }),
      new StaveNote({ keys: ["f/4"], duration: "q" }),
    ];

    // Measure 2
    const stave2 = new Stave(210, 40, 200);
    stave2.setContext(context).draw();

    const notes2 = [
      new StaveNote({ keys: ["g/4"], duration: "h" }),
      new StaveNote({ keys: ["g/4"], duration: "h" }),
    ];

    Formatter.FormatAndDraw(context, stave1, notes1);
    Formatter.FormatAndDraw(context, stave2, notes2);
  }, []);

  return <div ref={containerRef} />;
};

export default VexFlowMelody;

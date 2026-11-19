import React from "react";

export const loadMalamHeating3D = () => import("./MalamHeating3D");
export const MalamHeating3D = React.lazy(loadMalamHeating3D);

export const loadMalamPouring3D = () => import("./MalamPouring3D");
export const MalamPouring3D = React.lazy(loadMalamPouring3D);

export const loadMalamHardening3D = () => import("./MalamHardening3D");
export const MalamHardening3D = React.lazy(loadMalamHardening3D);

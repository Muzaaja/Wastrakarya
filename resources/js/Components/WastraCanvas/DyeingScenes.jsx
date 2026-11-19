import React from "react";

export const loadDyeingVat3D = () => import("./Dyeing/DyeingVat3D");
export const DyeingVat3D = React.lazy(loadDyeingVat3D);

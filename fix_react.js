const fs = require('fs');
const content = fs.readFileSync('src/app/shipping-scanner/scanner-list-client.tsx', 'utf8');
const replaced = content.replace(/import { useEffect, useState, useRef } from "react";/, 'import React, { useEffect, useState, useRef } from "react";');
fs.writeFileSync('src/app/shipping-scanner/scanner-list-client.tsx', replaced);

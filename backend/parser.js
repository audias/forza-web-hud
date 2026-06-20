export function parseForzaPacket(buf) {
  if (buf.length < 232) {
    return null; // Invalid packet size
  }

  // Parse Sled data
  const isRaceOn = buf.readInt32LE(0) !== 0;
  const timestampMs = buf.readUInt32LE(4);
  const engineMaxRpm = buf.readFloatLE(8);
  const engineIdleRpm = buf.readFloatLE(12);
  const currentEngineRpm = buf.readFloatLE(16);
  
  const accelerationX = buf.readFloatLE(20);
  const accelerationY = buf.readFloatLE(24);
  const accelerationZ = buf.readFloatLE(28);
  
  const velocityX = buf.readFloatLE(32);
  const velocityY = buf.readFloatLE(36);
  const velocityZ = buf.readFloatLE(40);
  
  const angularVelocityX = buf.readFloatLE(44);
  const angularVelocityY = buf.readFloatLE(48);
  const angularVelocityZ = buf.readFloatLE(52);
  
  const yaw = buf.readFloatLE(56);
  const pitch = buf.readFloatLE(60);
  const roll = buf.readFloatLE(64);
  
  const normalizedSuspensionTravelFl = buf.readFloatLE(68);
  const normalizedSuspensionTravelFr = buf.readFloatLE(72);
  const normalizedSuspensionTravelRl = buf.readFloatLE(76);
  const normalizedSuspensionTravelRr = buf.readFloatLE(80);
  
  const tireSlipRatioFl = buf.readFloatLE(84);
  const tireSlipRatioFr = buf.readFloatLE(88);
  const tireSlipRatioRl = buf.readFloatLE(92);
  const tireSlipRatioRr = buf.readFloatLE(96);
  
  const wheelRotationSpeedFl = buf.readFloatLE(100);
  const wheelRotationSpeedFr = buf.readFloatLE(104);
  const wheelRotationSpeedRl = buf.readFloatLE(108);
  const wheelRotationSpeedRr = buf.readFloatLE(112);
  
  const wheelOnRumbleStripFl = buf.readInt32LE(116);
  const wheelOnRumbleStripFr = buf.readInt32LE(120);
  const wheelOnRumbleStripRl = buf.readInt32LE(124);
  const wheelOnRumbleStripRr = buf.readInt32LE(128);
  
  const wheelInPuddleDepthFl = buf.readFloatLE(132);
  const wheelInPuddleDepthFr = buf.readFloatLE(136);
  const wheelInPuddleDepthRl = buf.readFloatLE(140);
  const wheelInPuddleDepthRr = buf.readFloatLE(144);
  
  const surfaceRumbleFl = buf.readFloatLE(148);
  const surfaceRumbleFr = buf.readFloatLE(152);
  const surfaceRumbleRl = buf.readFloatLE(156);
  const surfaceRumbleRr = buf.readFloatLE(160);
  
  const tireSlipAngleFl = buf.readFloatLE(164);
  const tireSlipAngleFr = buf.readFloatLE(168);
  const tireSlipAngleRl = buf.readFloatLE(172);
  const tireSlipAngleRr = buf.readFloatLE(176);
  
  const tireCombinedSlipFl = buf.readFloatLE(180);
  const tireCombinedSlipFr = buf.readFloatLE(184);
  const tireCombinedSlipRl = buf.readFloatLE(188);
  const tireCombinedSlipRr = buf.readFloatLE(192);
  
  const suspensionTravelMetersFl = buf.readFloatLE(196);
  const suspensionTravelMetersFr = buf.readFloatLE(200);
  const suspensionTravelMetersRl = buf.readFloatLE(204);
  const suspensionTravelMetersRr = buf.readFloatLE(208);
  
  const carOrdinal = buf.readInt32LE(212);
  const carClass = buf.readInt32LE(216);
  const carPerformanceIndex = buf.readInt32LE(220);
  const drivetrainType = buf.readInt32LE(224);
  const numCylinders = buf.readInt32LE(228);

  const baseTelemetry = {
    isRaceOn,
    timestampMs,
    engineMaxRpm,
    engineIdleRpm,
    currentEngineRpm,
    accelerationX,
    accelerationY,
    accelerationZ,
    velocityX,
    velocityY,
    velocityZ,
    angularVelocityX,
    angularVelocityY,
    angularVelocityZ,
    yaw,
    pitch,
    roll,
    normalizedSuspensionTravelFl,
    normalizedSuspensionTravelFr,
    normalizedSuspensionTravelRl,
    normalizedSuspensionTravelRr,
    tireSlipRatioFl,
    tireSlipRatioFr,
    tireSlipRatioRl,
    tireSlipRatioRr,
    wheelRotationSpeedFl,
    wheelRotationSpeedFr,
    wheelRotationSpeedRl,
    wheelRotationSpeedRr,
    wheelOnRumbleStripFl,
    wheelOnRumbleStripFr,
    wheelOnRumbleStripRl,
    wheelOnRumbleStripRr,
    wheelInPuddleDepthFl,
    wheelInPuddleDepthFr,
    wheelInPuddleDepthRl,
    wheelInPuddleDepthRr,
    surfaceRumbleFl,
    surfaceRumbleFr,
    surfaceRumbleRl,
    surfaceRumbleRr,
    tireSlipAngleFl,
    tireSlipAngleFr,
    tireSlipAngleRl,
    tireSlipAngleRr,
    tireCombinedSlipFl,
    tireCombinedSlipFr,
    tireCombinedSlipRl,
    tireCombinedSlipRr,
    suspensionTravelMetersFl,
    suspensionTravelMetersFr,
    suspensionTravelMetersRl,
    suspensionTravelMetersRr,
    carOrdinal,
    carClass,
    carPerformanceIndex,
    drivetrainType,
    numCylinders
  };

  // If the packet has the Dash fields (typically size >= 311)
  if (buf.length >= 311) {
    baseTelemetry.positionX = buf.readFloatLE(232);
    baseTelemetry.positionY = buf.readFloatLE(236);
    baseTelemetry.positionZ = buf.readFloatLE(240);
    baseTelemetry.speed = buf.readFloatLE(244);
    baseTelemetry.power = buf.readFloatLE(248);
    baseTelemetry.torque = buf.readFloatLE(252);
    baseTelemetry.tireTempFl = buf.readFloatLE(256);
    baseTelemetry.tireTempFr = buf.readFloatLE(260);
    baseTelemetry.tireTempRl = buf.readFloatLE(264);
    baseTelemetry.tireTempRr = buf.readFloatLE(268);
    baseTelemetry.boost = buf.readFloatLE(272);
    baseTelemetry.fuel = buf.readFloatLE(276);
    baseTelemetry.distanceTraveled = buf.readFloatLE(280);
    baseTelemetry.bestLap = buf.readFloatLE(284);
    baseTelemetry.lastLap = buf.readFloatLE(288);
    baseTelemetry.currentLap = buf.readFloatLE(292);
    baseTelemetry.currentRaceTime = buf.readFloatLE(296);
    baseTelemetry.lapNumber = buf.readUInt16LE(300);
    baseTelemetry.racePosition = buf.readUInt8(302);
    baseTelemetry.accel = buf.readUInt8(303);
    baseTelemetry.brake = buf.readUInt8(304);
    baseTelemetry.clutch = buf.readUInt8(305);
    baseTelemetry.handbrake = buf.readUInt8(306);
    baseTelemetry.gear = buf.readUInt8(307);
    baseTelemetry.steer = buf.readInt8(308);
    baseTelemetry.normalizedDrivingLine = buf.readInt8(309);
    baseTelemetry.normalizedAiBrake = buf.readInt8(310);
  }

  return baseTelemetry;
}

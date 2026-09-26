export type ClassRealtimeMode="group_call"|"webinar"|"livestream";

// Class privacy controls who may enter; it never grants a publishing role.
export function classPublisherStartsAuthorized(mode:ClassRealtimeMode,manager:boolean){
  return manager||mode==="group_call";
}

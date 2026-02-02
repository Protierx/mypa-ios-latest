#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(FocusTimerModule, NSObject)

RCT_EXTERN_METHOD(startLiveActivity:(NSString *)taskTitle
                  targetMinutes:(int)targetMinutes
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

RCT_EXTERN_METHOD(updateLiveActivity:(int)elapsedSeconds
                  isPaused:(BOOL)isPaused
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

RCT_EXTERN_METHOD(endLiveActivity:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

RCT_EXTERN_METHOD(isLiveActivitySupported:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

@end

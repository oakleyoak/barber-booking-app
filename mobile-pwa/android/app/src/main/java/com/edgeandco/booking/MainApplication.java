package com.edgeandco.booking;

import android.app.Application;
import com.stripe.stripeterminal.TerminalApplicationDelegate;

public class MainApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        TerminalApplicationDelegate.onCreate(this);
    }
}
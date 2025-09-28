package com.edgeandco.stripe;

import android.Manifest;
import android.content.pm.PackageManager;
import android.util.Log;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.stripe.stripeterminal.Terminal;
import com.stripe.stripeterminal.TerminalLifecycleObserver;
import com.stripe.stripeterminal.external.callable.Callback;
import com.stripe.stripeterminal.external.callable.Cancelable;
import com.stripe.stripeterminal.external.callable.PaymentIntentCallback;
import com.stripe.stripeterminal.external.callable.ReaderCallback;
import com.stripe.stripeterminal.external.models.ConnectionConfiguration;
import com.stripe.stripeterminal.external.models.DiscoveryConfiguration;
import com.stripe.stripeterminal.external.models.PaymentIntent;
import com.stripe.stripeterminal.external.models.PaymentIntentParameters;
import com.stripe.stripeterminal.external.models.Reader;
import com.stripe.stripeterminal.external.models.TerminalException;
import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "StripeTerminal")
public class StripeTerminalPlugin extends Plugin implements TerminalLifecycleObserver {

    private static final String TAG = "StripeTerminalPlugin";
    private Cancelable discoveryCancelable;
    private Cancelable paymentCancelable;

    @Override
    public void load() {
        super.load();
        Terminal.initTerminal(getContext().getApplicationContext(), LogLevel.VERBOSE, null, this);
    }

    @PluginMethod
    public void initialize(PluginCall call) {
        String token = call.getString("token");
        if (token == null) {
            call.reject("Token is required");
            return;
        }

        // Check permissions
        if (!checkPermissions()) {
            requestPermissions();
            call.reject("Permissions not granted");
            return;
        }

        // Initialize with connection token
        Terminal.getInstance().connectInternet(new ConnectionConfiguration.InternetConnectionConfiguration(token),
            new Callback() {
                @Override
                public void onSuccess() {
                    call.resolve();
                }

                @Override
                public void onFailure(TerminalException e) {
                    call.reject("Failed to initialize: " + e.getMessage());
                }
            });
    }

    @PluginMethod
    public void discoverReaders(PluginCall call) {
        DiscoveryConfiguration config = new DiscoveryConfiguration.LocalMobileDiscoveryConfiguration(true);
        discoveryCancelable = Terminal.getInstance().discoverReaders(config,
            new ReaderCallback() {
                @Override
                public void onSuccess(List<Reader> readers) {
                    JSObject result = new JSObject();
                    List<JSObject> readerList = new ArrayList<>();
                    for (Reader reader : readers) {
                        JSObject readerObj = new JSObject();
                        readerObj.put("id", reader.getId());
                        readerObj.put("label", reader.getLabel());
                        readerObj.put("status", "online");
                        readerList.add(readerObj);
                    }
                    result.put("readers", readerList);
                    call.resolve(result);
                }

                @Override
                public void onFailure(TerminalException e) {
                    call.reject("Discovery failed: " + e.getMessage());
                }
            },
            new Callback() {
                @Override
                public void onSuccess() {
                    // Discovery completed
                }

                @Override
                public void onFailure(TerminalException e) {
                    call.reject("Discovery error: " + e.getMessage());
                }
            });
    }

    @PluginMethod
    public void connectReader(PluginCall call) {
        String readerId = call.getString("readerId");
        if (readerId == null) {
            call.reject("Reader ID is required");
            return;
        }

        // Find the reader from discovered readers
        List<Reader> readers = Terminal.getInstance().getConnectedReader() != null ?
            new ArrayList<>() : new ArrayList<>(); // In real implementation, you'd store discovered readers

        call.reject("Reader connection not implemented - need to store discovered readers");
    }

    @PluginMethod
    public void processPayment(PluginCall call) {
        Integer amount = call.getInt("amount");
        String currency = call.getString("currency");

        if (amount == null || currency == null) {
            call.reject("Amount and currency are required");
            return;
        }

        PaymentIntentParameters params = new PaymentIntentParameters.Builder()
            .setAmount(amount)
            .setCurrency(currency)
            .build();

        Terminal.getInstance().createPaymentIntent(params, new PaymentIntentCallback() {
            @Override
            public void onSuccess(PaymentIntent paymentIntent) {
                // Process the payment
                paymentCancelable = Terminal.getInstance().collectPaymentMethod(paymentIntent, new PaymentIntentCallback() {
                    @Override
                    public void onSuccess(PaymentIntent intent) {
                        // Confirm payment
                        Terminal.getInstance().confirmPaymentIntent(intent, new PaymentIntentCallback() {
                            @Override
                            public void onSuccess(PaymentIntent confirmedIntent) {
                                JSObject result = new JSObject();
                                JSObject intentObj = new JSObject();
                                intentObj.put("id", confirmedIntent.getId());
                                intentObj.put("amount", confirmedIntent.getAmount());
                                intentObj.put("currency", confirmedIntent.getCurrency());
                                intentObj.put("status", "succeeded");
                                result.put("paymentIntent", intentObj);
                                call.resolve(result);
                            }

                            @Override
                            public void onFailure(TerminalException e) {
                                call.reject("Payment confirmation failed: " + e.getMessage());
                            }
                        });
                    }

                    @Override
                    public void onFailure(TerminalException e) {
                        call.reject("Payment collection failed: " + e.getMessage());
                    }
                });
            }

            @Override
            public void onFailure(TerminalException e) {
                call.reject("Payment intent creation failed: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void disconnectReader(PluginCall call) {
        if (Terminal.getInstance().getConnectedReader() != null) {
            Terminal.getInstance().disconnectReader(new Callback() {
                @Override
                public void onSuccess() {
                    call.resolve();
                }

                @Override
                public void onFailure(TerminalException e) {
                    call.reject("Disconnect failed: " + e.getMessage());
                }
            });
        } else {
            call.resolve();
        }
    }

    private boolean checkPermissions() {
        return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED &&
               ContextCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH) == PackageManager.PERMISSION_GRANTED;
    }

    private void requestPermissions() {
        ActivityCompat.requestPermissions(getActivity(),
            new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.BLUETOOTH},
            1);
    }

    @Override
    public void onUnexpectedReaderDisconnect(Reader reader) {
        Log.w(TAG, "Reader disconnected unexpectedly: " + reader.getId());
        // Notify JavaScript side
        JSObject event = new JSObject();
        event.put("status", "disconnected");
        event.put("readerId", reader.getId());
        notifyListeners("readerDisconnected", event);
    }
}
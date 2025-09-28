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
import com.stripe.stripeterminal.external.callable.Callback;
import com.stripe.stripeterminal.external.callable.Cancelable;
import com.stripe.stripeterminal.external.callable.PaymentIntentCallback;
import com.stripe.stripeterminal.external.callable.DiscoveryListener;
import com.stripe.stripeterminal.external.callable.ReaderCallback;
import com.stripe.stripeterminal.external.models.ConnectionConfiguration;
import com.stripe.stripeterminal.external.models.DiscoveryConfiguration;
import com.stripe.stripeterminal.external.models.PaymentIntent;
import com.stripe.stripeterminal.external.models.PaymentIntentParameters;
import com.stripe.stripeterminal.external.models.Reader;
import com.stripe.stripeterminal.external.models.TerminalException;
import com.stripe.stripeterminal.external.models.CollectConfiguration;
import java.util.List;
import java.util.ArrayList;

@CapacitorPlugin(name = "StripeTerminal")
public class StripeTerminalPlugin extends Plugin {

    private static final String TAG = "StripeTerminalPlugin";
    private Cancelable discoveryCancelable;
    private Cancelable paymentCancelable;
    private List<Reader> discoveredReaders = new ArrayList<>();

    @Override
    public void load() {
        super.load();
        // Initialize Terminal in load() instead of onCreate
        try {
            Terminal.initTerminal(getContext().getApplicationContext(), null, null);
        } catch (TerminalException e) {
            Log.e(TAG, "Failed to initialize Terminal", e);
        }
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

        // For Tap to Pay, we don't need to connect to internet first
        // The connection token will be used when connecting to the local reader
        call.resolve();
    }

    @PluginMethod
    public void discoverReaders(PluginCall call) {
        DiscoveryConfiguration config = new DiscoveryConfiguration.TapToPayDiscoveryConfiguration();
        discoveryCancelable = Terminal.getInstance().discoverReaders(config,
            new DiscoveryListener() {
                @Override
                public void onUpdateDiscoveredReaders(List<Reader> readers) {
                    discoveredReaders.clear();
                    discoveredReaders.addAll(readers);

                    JSObject result = new JSObject();
                    List<JSObject> readerList = new ArrayList<>();
                    for (Reader reader : readers) {
                        JSObject readerObj = new JSObject();
                        readerObj.put("id", reader.getId());
                        readerObj.put("label", reader.getLabel() != null ? reader.getLabel() : "Tap to Pay");
                        readerObj.put("status", "online");
                        readerList.add(readerObj);
                    }
                    result.put("readers", readerList);
                    call.resolve(result);
                }
            },
            new Callback() {
                @Override
                public void onSuccess() {
                    // Discovery completed
                }

                @Override
                public void onFailure(TerminalException e) {
                    call.reject("Discovery failed: " + e.getMessage());
                }
            });
    }    @PluginMethod
    public void connectReader(PluginCall call) {
        String readerId = call.getString("readerId");
        if (readerId == null) {
            call.reject("Reader ID is required");
            return;
        }

        // For Tap to Pay, the device itself is the reader
        // We don't need to connect to an external reader
        // Just mark as connected since discovery already found the device
        call.resolve();
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
                CollectConfiguration collectConfig = new CollectConfiguration.Builder().build();
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
                }, collectConfig);
            }

            @Override
            public void onFailure(TerminalException e) {
                call.reject("Payment intent creation failed: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void disconnectReader(PluginCall call) {
        // For Tap to Pay, the device itself is always the reader
        // No need to disconnect from external readers
        call.resolve();
    }

    private boolean checkPermissions() {
        return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.NFC) == PackageManager.PERMISSION_GRANTED;
    }

    private void requestPermissions() {
        ActivityCompat.requestPermissions(getActivity(),
            new String[]{Manifest.permission.NFC},
            1);
    }
}
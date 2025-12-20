"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { useClients } from "@/hooks/use-clients";
import { useDealMutations } from "@/hooks/use-deals";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const DEAL_TYPES = [
  "ACQUISITION", "DISPOSITION", "FINANCING", "REFINANCING",
  "LEASE", "DEVELOPMENT", "JOINT_VENTURE", "OTHER"
] as const;

const PROPERTY_TYPES = [
  "OFFICE", "RETAIL", "INDUSTRIAL", "MULTIFAMILY", "MIXED_USE",
  "LAND", "HOSPITALITY", "HEALTHCARE", "SELF_STORAGE", "DATA_CENTER", "OTHER"
] as const;

const dealFormSchema = z.object({
  // Step 1: Basic Info
  name: z.string().min(1, "Deal name is required").max(200),
  type: z.enum(DEAL_TYPES),
  clientId: z.string().min(1, "Client is required"),
  // Step 2: Property Details
  propertyName: z.string().max(200).optional(),
  propertyType: z.enum(PROPERTY_TYPES).optional(),
  propertyAddress: z.string().max(500).optional(),
  propertyCity: z.string().max(100).optional(),
  propertyState: z.string().max(50).optional(),
  propertyZip: z.string().max(20).optional(),
  propertyCounty: z.string().max(100).optional(),
  acreage: z.string().optional(),
  squareFootage: z.string().optional(),
});

type DealFormValues = z.infer<typeof dealFormSchema>;

const dealTypeOptions = [
  { value: "ACQUISITION" as const, label: "Acquisition" },
  { value: "DISPOSITION" as const, label: "Disposition" },
  { value: "FINANCING" as const, label: "Financing" },
  { value: "REFINANCING" as const, label: "Refinancing" },
  { value: "LEASE" as const, label: "Lease" },
  { value: "DEVELOPMENT" as const, label: "Development" },
  { value: "JOINT_VENTURE", label: "Joint Venture" },
  { value: "OTHER", label: "Other" },
];

const propertyTypeOptions = [
  { value: "OFFICE" as const, label: "Office" },
  { value: "RETAIL" as const, label: "Retail" },
  { value: "INDUSTRIAL" as const, label: "Industrial" },
  { value: "MULTIFAMILY" as const, label: "Multifamily" },
  { value: "MIXED_USE" as const, label: "Mixed Use" },
  { value: "LAND" as const, label: "Land" },
  { value: "HOSPITALITY" as const, label: "Hospitality" },
  { value: "HEALTHCARE" as const, label: "Healthcare" },
  { value: "SELF_STORAGE" as const, label: "Self Storage" },
  { value: "DATA_CENTER" as const, label: "Data Center" },
  { value: "OTHER" as const, label: "Other" },
];

const usStates = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

const steps = [
  { id: 1, name: "Basic Info", description: "Deal name and type" },
  { id: 2, name: "Property Details", description: "Property information" },
  { id: 3, name: "Review", description: "Review and create" },
];

export default function NewDealPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);

  const { data: clientsData, isLoading: clientsLoading } = useClients();
  const { createDeal } = useDealMutations();

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      name: "",
      type: "ACQUISITION",
      clientId: "",
      propertyName: "",
      propertyType: undefined,
      propertyAddress: "",
      propertyCity: "",
      propertyState: "",
      propertyZip: "",
      propertyCounty: "",
      acreage: "",
      squareFootage: "",
    },
  });

  const clients = clientsData?.clients || [];

  const validateStep = async () => {
    if (currentStep === 1) {
      return form.trigger(["name", "type", "clientId"]);
    }
    if (currentStep === 2) {
      return form.trigger([
        "propertyName",
        "propertyType",
        "propertyAddress",
        "propertyCity",
        "propertyState",
        "propertyZip",
      ]);
    }
    return true;
  };

  const handleNext = async () => {
    const isValid = await validateStep();
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: DealFormValues) => {
    try {
      const submitData = {
        ...data,
        acreage: data.acreage ? parseFloat(data.acreage) : undefined,
        squareFootage: data.squareFootage ? parseFloat(data.squareFootage) : undefined,
      };
      const result = await createDeal.mutateAsync(submitData);
      toast({
        title: "Deal created",
        description: "Your new deal has been created successfully.",
      });
      router.push("/deals/" + result.id);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create deal",
        variant: "destructive",
      });
    }
  };

  const formValues = form.watch();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/deals">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Deal</h1>
          <p className="text-muted-foreground">Create a new commercial real estate deal</p>
        </div>
      </div>

      {/* Step Indicator */}
      <nav aria-label="Progress">
        <ol className="flex items-center">
          {steps.map((step, stepIdx) => (
            <li
              key={step.name}
              className={cn(
                stepIdx !== steps.length - 1 ? "flex-1" : "",
                "relative"
              )}
            >
              {step.id < currentStep ? (
                <div className="group flex w-full items-center">
                  <span className="flex items-center px-6 py-4 text-sm font-medium">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary">
                      <Check className="h-6 w-6 text-primary-foreground" />
                    </span>
                    <span className="ml-4 text-sm font-medium">{step.name}</span>
                  </span>
                </div>
              ) : step.id === currentStep ? (
                <div className="flex items-center px-6 py-4 text-sm font-medium" aria-current="step">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary">
                    <span className="text-primary">{step.id}</span>
                  </span>
                  <span className="ml-4 text-sm font-medium text-primary">{step.name}</span>
                </div>
              ) : (
                <div className="group flex items-center">
                  <span className="flex items-center px-6 py-4 text-sm font-medium">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-muted">
                      <span className="text-muted-foreground">{step.id}</span>
                    </span>
                    <span className="ml-4 text-sm font-medium text-muted-foreground">{step.name}</span>
                  </span>
                </div>
              )}
              {stepIdx !== steps.length - 1 && (
                <div className="absolute right-0 top-0 hidden h-full w-5 md:block" aria-hidden="true">
                  <div className="h-full w-px ml-4 bg-muted" />
                </div>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Enter the basic details for your deal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deal Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 123 Main Street Acquisition" {...field} />
                      </FormControl>
                      <FormDescription>A descriptive name for this deal</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deal Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select deal type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {dealTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={clientsLoading ? "Loading..." : "Select a client"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name} {client.company && `(${client.company})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 2: Property Details */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
                <CardDescription>Enter the property information (optional)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="propertyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Downtown Office Tower" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select property type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {propertyTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="propertyAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main Street" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="propertyCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="propertyState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="State" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {usStates.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="propertyZip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input placeholder="12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="propertyCounty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>County</FormLabel>
                      <FormControl>
                        <Input placeholder="County" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="acreage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Acreage</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="squareFootage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Square Footage</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Review Deal</CardTitle>
                <CardDescription>Review the information before creating the deal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Basic Information</h4>
                    <dl className="mt-2 grid gap-2 md:grid-cols-2">
                      <div>
                        <dt className="text-sm text-muted-foreground">Deal Name</dt>
                        <dd className="text-sm font-medium">{formValues.name || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Deal Type</dt>
                        <dd className="text-sm font-medium">
                          {dealTypeOptions.find((o) => o.value === formValues.type)?.label || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Client</dt>
                        <dd className="text-sm font-medium">
                          {clients.find((c) => c.id === formValues.clientId)?.name || "—"}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Property Details</h4>
                    <dl className="mt-2 grid gap-2 md:grid-cols-2">
                      <div>
                        <dt className="text-sm text-muted-foreground">Property Name</dt>
                        <dd className="text-sm font-medium">{formValues.propertyName || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Property Type</dt>
                        <dd className="text-sm font-medium">
                          {propertyTypeOptions.find((o) => o.value === formValues.propertyType)?.label || "—"}
                        </dd>
                      </div>
                      <div className="md:col-span-2">
                        <dt className="text-sm text-muted-foreground">Address</dt>
                        <dd className="text-sm font-medium">
                          {[
                            formValues.propertyAddress,
                            formValues.propertyCity,
                            formValues.propertyState,
                            formValues.propertyZip,
                          ]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">County</dt>
                        <dd className="text-sm font-medium">{formValues.propertyCounty || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Size</dt>
                        <dd className="text-sm font-medium">
                          {formValues.acreage && `${formValues.acreage} acres`}
                          {formValues.acreage && formValues.squareFootage && " / "}
                          {formValues.squareFootage && `${formValues.squareFootage} sq ft`}
                          {!formValues.acreage && !formValues.squareFootage && "—"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {currentStep < 3 ? (
              <Button type="button" onClick={handleNext}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={createDeal.isPending}>
                {createDeal.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Deal
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}

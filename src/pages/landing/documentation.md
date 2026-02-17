# Doc Generator Guide

## Introduction
Welcome to the Doc Generator Guide. This guide explains all the dynamic placeholders you can use when generating documents for your projects.

### Macros
Macros are regular placeholders that you can put in a document template that then is automatically populated with content from a specific project. The specific Macros that we offer are shown on this page. Macro names are encased by `{}` and the entire Macro, including the brackets, are replaced when populating.

### Compound Macros
Compound macros are more complicated Macros where there is a group of regular macros. You first have to state the group in your document by `{#Name}` which opens the group and `{/Name}` which ends the group. Nothing is put in place of these starting and closing macros. Now within the the group there are more macros that you can put.<br><br>

For example, for the advanced `{#Labor}` macro, we allow you to also control how you want each element of a Labor item be placed. This means you can control where you want the Quantity and Price be shown and in what order. The opening and closing macros are there create a structure PER item. This means you can have this structure:<br><br>

```
{#Labor}
 Qty: {LaborQty}, Title: {LaborTitle}
 {/Labor}
```

<br>
This wil end up producing results such as:
<br><br>

```
Qty: 5, Title: Toilet
 Qty: 7, Title: Outlets
 Qty: 3, Title: Doors
 Qty: 1, Title: Dining Room Tables
 ...
```

### Conditional Macros
Conditional macros are also more complicated macros where you can populate a field based on if some value is present or not; its a conditional. Just as the compound macro, it has a opening `{#hasFirstPayment}` and a closing `{/hasFirstPayment}` that tell you where the full group is.<br><br>

It will only show the contents of the group only if hasFirstPayment is True. In other words, if first payment exists, then it will show it.<br>

## You & Client
### {ClientName}
Client's full name.

### {ClientEmail}
Client's email address.

### {ClientPhoneNumber}
Client's phone number.

### {AssignedStaffName}
Name of the assigned staff to that client.

### {AssignedStaffEmail}
Email of the assigned staff to that client.


## Project Info
### {ProjectTitle}
Project Title of active/sold project.

### {ProjectType}
Project Type of active/sold project.

### {ProjectAddress}
Physical address of active/sold project.

### {ProjectStatus}
Status of active/sold project.

### {Multiplier}
Multiplier of active/sold draft.

### {StartDate}
Estimated Start Date of active/sold draft.

### {Weeks}
Estimated Construction Time of active/sold draft in weeks.

### {QuoteNo}
Need to finish

### {QuickNotes}
Quick notes of active/sold project.

### {Notes}
Notes of active/sold project.

### {#AssignedCrew} *
This is a [compound macro](#compound-macros) meaning there are a few more that go with it. These are other macros that are options that go with the AssignedCrew macro:

* {AssignedCrewName} - Name of the assigned staff
* {AssignedCrewEmail} - Email of the assigned staff

Here is how you implement it into your document:

```
{#AssignedCrew}   <-- Required, start of the group
 {AssignedCrewName}
 {AssignedCrewEmail}
 {/AssignedCrew}  <-- Required, end of the group
```

### {#LookbookQ} *
This is a [compound macro](#compound-macros) meaning there are a few more that go with it. These are other macros that are options that go with the LookbookQ macro:

* {LookbookQQuestions} - Questions from lookbook
* {LookbookQAnswers} - Answers for the questions from lookbook

Here is how you implement it into your document:

```
{#LookbookQ}   <-- Required, start of the group
 {LookbookQQuestions}
 {LookbookQAnswers}
 {/LookbookQ}  <-- Required, end of the group
```

### {#LookbookS} *
This is a [compound macro](#compound-macros) meaning there are a few more that go with it. It populates with the current project's **liked/selected** lookbook items.

* {LookbookSCategory} - Category of the item
* {LookbookSTitle} - Item title (style name)
* {LookbookSBrand} - Brand name
* {LookbookSStyle} - Style name
* {LookbookSFinish} - Finish type
* {LookbookSLink} - Link/URL to the item
* {LookbookSPrice} - Price (formatted as 0.00)
* {LookbookSModel} - Model number
* {LookbookSCollection} - Collection name

Here is how you implement it into your document:

```
{#LookbookS}   <-- Required, start of the group
 {LookbookSCategory}
 {LookbookSTitle}
 {LookbookSBrand}
 {LookbookSStyle}
 {LookbookSFinish}
 {LookbookSLink}
 {LookbookSPrice}
 {LookbookSModel}
 {LookbookSCollection}
 {/LookbookS}  <-- Required, end of the group
```


## Materials & Labor
### {#ProjectMaterials} *
These are the items that are under Materials section from the Quote Builder tab.

This is a [compound macro](#compound-macros) meaning there are a few more that go with it. These are other macros that are options that go with the ProjectMaterials macro: 

* {ProjectMaterialsTitle}
* {ProjectMaterialsQty}
* {ProjectMaterialsPrice}
* {ProjectMaterialsTotal}

Here is how you implement it into your document:

```
{#ProjectMaterials}     <-- Required, start of the group
 {ProjectMaterialsTitle}
 {ProjectMaterialsQty}
 {ProjectMaterialsPrice}
 {ProjectMaterialsTotal}
 {/ProjectMaterials}    <-- Required, end of the group
```

### {#Labor} *
These are the items that are under the Labor section in Quote Builder tab.

This is a [compound macro](#compound-macros) meaning there are a few more that go with it. These are other macros that are options that go with the Labor macro:

* {LaborTitle}
* {LaborQty}
* {LaborPrice}
* {LaborTotal}

Here is how you implement it into your document:

```
{#Labor}    <-- Required, start of the group
 {LaborTitle}
 {LaborQty}
 {LaborPrice}
 {LaborTotal}
 {/Labor}   <-- Required, end of the group
```

### {#Materials} *
These are the items in the revised section of Materials tab.

This is a [compound macro](#compound-macros) meaning there are a few more that go with it. These are other macros that are options that go with the Materials macro:

* {MaterialsLinkedTo} - What the material is linked to
* {MaterialsTitle} - Material name
* {MaterialsLink} - Material link/URL
* {MaterialsQuantity} - Quantity
* {MaterialsNotes} - Notes
* {MaterialsPrice} - Unit price
* {MaterialsTotal} - Total (Qty × Price)

Here is how you implement it into your document:

```
{#Materials}   <-- Required, start of the group
 {MaterialsLinkedTo}
 {MaterialsTitle}
 {MaterialsLink}
 {MaterialsQuantity}
 {MaterialsNotes}
 {MaterialsPrice}
 {MaterialsTotal}
 {/Materials}   <-- Required, end of the gorup
```

### {#ChangeOrderProjectMaterials} *
These are the items from the Materials section from Change Order tab.

This is a [compound macro](#compound-macros) meaning there are a few more that go with it. Only materials that were **Added**, **Modified**, or **Removed** in the change order are included. Fields ending in **B** = Before (baseline), **A** = After (CO result), **D** = Delta (After − Before).

**Before (baseline values):**
* {ChangeOrderProjectMaterialsTitleB} - Item name before the change (empty for Added items)
* {ChangeOrderProjectMaterialsQtyB} - Quantity before the change
* {ChangeOrderProjectMaterialsPriceB} - Unit price before the change
* {ChangeOrderProjectMaterialsTotalB} - Total before the change (Qty × Price)

**After (CO result values):**
* {ChangeOrderProjectMaterialsTitleA} - Item name after the change
* {ChangeOrderProjectMaterialsQtyA} - Quantity after the change (0 for Removed items)
* {ChangeOrderProjectMaterialsPriceA} - Unit price after the change
* {ChangeOrderProjectMaterialsTotalA} - Total after the change (Qty × Price, 0 for Removed items)

**Delta (difference):**
* {ChangeOrderProjectMaterialsQtyD} - Qty change (e.g. +3, -2)
* {ChangeOrderProjectMaterialsPriceD} - Price change (e.g. +5.00, -2.50)
* {ChangeOrderProjectMaterialsTotalD} - Total change (e.g. +150.00, -50.00)

**Change type:**
* {ChangeOrderProjectMaterialsChange} - **Added**, **Modified**, or **Removed**

Here is how you implement it into your document:

```
{#ChangeOrderProjectMaterials}     <-- Required, start of the group
 {ChangeOrderProjectMaterialsTitleB}
 {ChangeOrderProjectMaterialsQtyB}
 {ChangeOrderProjectMaterialsPriceB}
 {ChangeOrderProjectMaterialsTotalB}

 {ChangeOrderProjectMaterialsTitleA}
 {ChangeOrderProjectMaterialsQtyA}
 {ChangeOrderProjectMaterialsPriceA}
 {ChangeOrderProjectMaterialsTotalA}

 {ChangeOrderProjectMaterialsQtyD}
 {ChangeOrderProjectMaterialsPriceD}
 {ChangeOrderProjectMaterialsTotalD}

 {ChangeOrderProjectMaterialsChange}
 {/ChangeOrderProjectMaterials}    <-- Required, end of the group
```
### {#ChangeOrderLabor} *
These are the items from the Labor section from Change Order tab.

This is a [compound macro](#compound-macros) meaning there are a few more that go with it. Only labor items that were **Added**, **Modified**, or **Removed** in the change order are included. Fields ending in **B** = Before (baseline), **A** = After (CO result), **D** = Delta (After − Before).

**Before (baseline values):**
* {ChangeOrderLaborTitleB} - Item name before the change (empty for Added items)
* {ChangeOrderLaborQtyB} - Quantity before the change
* {ChangeOrderLaborPriceB} - Unit price before the change
* {ChangeOrderLaborTotalB} - Total before the change (Qty × Price)

**After (CO result values):**
* {ChangeOrderLaborTitleA} - Item name after the change
* {ChangeOrderLaborQtyA} - Quantity after the change (0 for Removed items)
* {ChangeOrderLaborPriceA} - Unit price after the change
* {ChangeOrderLaborTotalA} - Total after the change (Qty × Price, 0 for Removed items)

**Delta (difference):**
* {ChangeOrderLaborQtyD} - Qty change (e.g. +3, -2)
* {ChangeOrderLaborPriceD} - Price change (e.g. +5.00, -2.50)
* {ChangeOrderLaborTotalD} - Total change (e.g. +150.00, -50.00)

**Change type:**
* {ChangeOrderLaborChange} - **Added**, **Modified**, or **Removed**

Here is how you implement it into your document:

```
{#ChangeOrderLabor}     <-- Required, start of the group
 {ChangeOrderLaborTitleB}
 {ChangeOrderLaborQtyB}
 {ChangeOrderLaborPriceB}
 {ChangeOrderLaborTotalB}

 {ChangeOrderLaborTitleA}
 {ChangeOrderLaborQtyA}
 {ChangeOrderLaborPriceA}
 {ChangeOrderLaborTotalA}

 {ChangeOrderLaborQtyD}
 {ChangeOrderLaborPriceD}
 {ChangeOrderLaborTotalD}

 {ChangeOrderLaborChange}
 {/ChangeOrderLabor}    <-- Required, end of the group
```

### {#ChangeOrderMaterials} *
These are the items from the revised section from Materials tab for Change Order's.

This is a [compound macro](#compound-macros) meaning there are a few more that go with it. It works the same as `{#Materials}` but pulls from the **selected change order's** material revisions instead of the active draft.

* {ChangeOrderMaterialsLinkedTo} - What the material is linked to
* {ChangeOrderMaterialsTitle} - Material name
* {ChangeOrderMaterialsLink} - Material link/URL
* {ChangeOrderMaterialsQuantity} - Quantity
* {ChangeOrderMaterialsNotes} - Notes
* {ChangeOrderMaterialsPrice} - Unit price
* {ChangeOrderMaterialsTotal} - Total (Qty × Price)

Here is how you implement it into your document:

```
{#ChangeOrderMaterials}     <-- Required, start of the group
 {ChangeOrderMaterialsLinkedTo}
 {ChangeOrderMaterialsTitle}
 {ChangeOrderMaterialsLink}
 {ChangeOrderMaterialsQuantity}
 {ChangeOrderMaterialsNotes}
 {ChangeOrderMaterialsPrice}
 {ChangeOrderMaterialsTotal}
 {/ChangeOrderMaterials}    <-- Required, end of the group
```

## Payments
### {ProjectTotal}
The total project cost including contract and all change orders.

### {ChangeOrderTotal}
The total of a selected change order.

### {AllChangeOrderTotal}
The cumulative total of all active change orders.

### {TotalPaid}
The total amount that has been paid by the client to date.

### {Balance}
The remaining balance owed on the project.

### {ContractTotal}
The original contract amount before any change orders.

### {Payment1}
The amount that is set in the First Payment amount during the payment split.

### {Payment2}
The amount that is set in the second Payment amount during the payment split.

### {Payment3}
The amount that is set in the Third Payment amount during the payment split.

### {Payment4}
The amount that is set in the Last Payment amount during the payment split.

### {#IncomingPayments} *
This is a [compound macro](#compound-macros) meaning there are a few more that go with it. These are other macros that are options that go with the IncomingPayments macro:

* {IncomingPaymentsDate}
* {IncomingPaymentsAmount}
* {IncomingPaymentsType}
* {IncomingPaymentsReceivedBy}
* {IncomingPaymentsFor}
* {IncomingPaymentsNotes}

Here is how you implement it into your document:

```
{#IncomingPayments}     <-- Required, start of the group
 {IncomingPaymentsDate}
 {IncomingPaymentsAmount}
 {IncomingPaymentsType}
 {IncomingPaymentsReceivedBy}
 {IncomingPaymentsFor}
 {IncomingPaymentsNotes}
 {/IncomingPayments}    <-- Required, end of the group
```

### {#OutgoingPayments} *
This is a [compound macro](#compound-macros) meaning there are a few more that go with it. These are other macros that are options that go with the OutgoingPayments macro:

* {OutgoingPaymentsDate}
* {OutgoingPaymentsItem}
* {OutgoingPaymentsLink}
* {OutgoingPaymentsTotalPrice}
* {OutgoingPaymentsQty}
* {OutgoingPaymentsTracking}
* {OutgoingPaymentsNotes}

Here is how you implement it into your document:

```
{#OutgoingPayments}     <-- Required, start of the group
 {OutgoingPaymentsDate}
 {OutgoingPaymentsItem}
 {OutgoingPaymentsLink}
 {OutgoingPaymentsTotalPrice}
 {OutgoingPaymentsQty}
 {OutgoingPaymentsTracking}
 {OutgoingPaymentsNotes}
 {/OutgoingPayments}    <-- Required, end of the group
```

### {#hasFirstPayment} *
This is a [conditional macro](#conditional-macros) meaning that the contents of the body of the macro will only appear if the first payment split is more than 0.

This Macro is great to pair with {Payment1}:

```
{#hasFirstPayment}   <-- Required, start of conditional
 First payment due upon signing: {Payment1}
 {/hasFirstPayment}   <-- Required, end of conditional
```

The results of this will depend if you set a value to the First Payment in payment split. If the value is set to 0, then nothing within the body of the conditional will show.

### {#hasSecondPayment} *
This is a [conditional macro](#conditional-macros) meaning that the contents of the body of the macro will only appear if the second payment split is more than 0.

This Macro is great to pair with {Payment2}:

```
{#hasSecondPayment}   <-- Required, start of conditional
 Second payment due upon signing: {Payment2}
 {/hasSecondPayment}   <-- Required, end of conditional
```

The results of this will depend if you set a value to the Second Payment in payment split. If the value is set to 0, then nothing within the body of the conditional will show.

### {#hasThirdPayment} *
This is a [conditional macro](#conditional-macros) meaning that the contents of the body of the macro will only appear if the third payment split is more than 0.

This Macro is great to pair with {Payment3}:

```
{#hasThirdPayment}   <-- Required, start of conditional
 Third payment due upon signing: {Payment3}
 {/hasThirdPayment}   <-- Required, end of conditional
```

The results of this will depend if you set a value to the Third Payment in payment split. If the value is set to 0, then nothing within the body of the conditional will show.

### {#hasLastPayment} *
This is a [conditional macro](#conditional-macros) meaning that the contents of the body of the macro will only appear if the last payment split is more than 0.

This Macro is great to pair with {Payment4}:

```
{#hasLastPayment}   <-- Required, start of conditional
 Last payment due upon signing: {Payment4}
 {/hasLastPayment}   <-- Required, end of conditional
```

The results of this will depend if you set a value to the Last Payment in payment split. If the value is set to 0, then nothing within the body of the conditional will show.


## Miscellaneous
### {Date}
Current Date of when document is generated.